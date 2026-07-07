import { NextResponse, NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin Verification
    const isAdmin = user.emailAddresses.some(
      e => e.emailAddress.startsWith('admin') || 
           e.emailAddress === 'premchandsharma@gmail.com' || 
           e.emailAddress === 'itzpremsharma01@gmail.com'
    )

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const slug = formData.get('slug') as string | null

    if (!file || !slug) {
      return NextResponse.json({ error: 'Missing file or game slug' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Invalid file format. Please upload a .zip file.' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let zip: AdmZip
    try {
      zip = new AdmZip(buffer)
    } catch (e: any) {
      return NextResponse.json({ error: 'Failed to read zip archive: ' + e.message }, { status: 400 })
    }

    const entries = zip.getEntries()
    
    // Validate package structure (Look for index.html)
    let indexEntry = entries.find(entry => entry.entryName.toLowerCase().endsWith('index.html'))
    if (!indexEntry) {
      return NextResponse.json({ error: 'Validation Error: No index.html file found in the ZIP package.' }, { status: 400 })
    }

    // Target directory inside public folder
    const uploadDir = path.join(process.cwd(), 'public', 'games-uploads', slug)
    
    // Ensure parent directories exist
    if (fs.existsSync(uploadDir)) {
      // Clear existing directory for version replacement
      fs.rmSync(uploadDir, { recursive: true, force: true })
    }
    fs.mkdirSync(uploadDir, { recursive: true })

    // Extract all files safely
    try {
      zip.extractAllTo(uploadDir, true)
    } catch (e: any) {
      return NextResponse.json({ error: 'Extraction failed: ' + e.message }, { status: 500 })
    }

    // Post-Extraction folder shift: If the zip had a single root subfolder, shift all contents up
    const extractedItems = fs.readdirSync(uploadDir)
    if (extractedItems.length === 1 && fs.statSync(path.join(uploadDir, extractedItems[0])).isDirectory()) {
      const subDir = path.join(uploadDir, extractedItems[0])
      const subItems = fs.readdirSync(subDir)
      for (const item of subItems) {
        fs.renameSync(path.join(subDir, item), path.join(uploadDir, item))
      }
      fs.rmdirSync(subDir)
    }

    // Confirm index.html path works
    const finalIndexPath = path.join(uploadDir, 'index.html')
    if (!fs.existsSync(finalIndexPath)) {
      // If index.html is nested deeper, search for it and find relative path
      const findIndexRecursively = (dir: string): string | null => {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          if (fs.statSync(fullPath).isDirectory()) {
            const found = findIndexRecursively(fullPath)
            if (found) return found
          } else if (item.toLowerCase() === 'index.html') {
            return fullPath
          }
        }
        return null
      }

      const absoluteIndex = findIndexRecursively(uploadDir)
      if (!absoluteIndex) {
        return NextResponse.json({ error: 'index.html could not be resolved post-extraction.' }, { status: 400 })
      }
      
      const relativeIndex = path.relative(uploadDir, absoluteIndex)
      return NextResponse.json({
        success: true,
        iframeUrl: `/games-uploads/${slug}/${relativeIndex.replace(/\\/g, '/')}`
      })
    }

    return NextResponse.json({
      success: true,
      iframeUrl: `/games-uploads/${slug}/index.html`
    })

  } catch (error: any) {
    console.error('HTML5 Zip upload error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
