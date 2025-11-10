'use client';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Main content */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-balance">
            <span className="bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
              SocialBook
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
