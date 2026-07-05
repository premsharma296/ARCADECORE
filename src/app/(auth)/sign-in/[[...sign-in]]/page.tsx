import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden scanlines">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 height-96 rounded-full bg-primary/10 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 height-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 p-8 rounded-2xl glass shadow-2xl border border-primary/20">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider font-display text-primary glow-primary">
            ARCADE<span className="text-secondary glow-secondary">CORE</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Level up your browser gaming experience</p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/80 text-white font-semibold transition-colors duration-200 border-0",
              card: "bg-transparent shadow-none border-0 p-0",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-muted border border-border text-foreground hover:bg-muted/80",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput: "bg-muted border border-border text-foreground focus:ring-primary focus:border-primary",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreviewText: "text-foreground",
              identityPreviewEditButtonIcon: "text-muted-foreground",
            },
          }}
        />
      </div>
    </div>
  );
}
