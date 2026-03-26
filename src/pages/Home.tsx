import { motion } from 'framer-motion';
import { Trees, Sprout, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-light to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-forest-normal/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Trees className="w-6 h-6 text-forest-normal" />
            <span className="font-bold text-lg text-forest-dark">Memory Forest</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link to="/tree">
              <Button className="bg-forest-normal hover:bg-forest-normal/90">Enter App</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 px-4 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-forest-dark to-forest-normal bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Your Memories,<br />Growing Together
          </motion.h1>

          <motion.p
            className="text-xl text-forest-dark/70 mb-8 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Plant your life's precious moments as seeds. Watch them grow into a beautiful memory tree. Share your forest with friends and loved ones.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link to="/tree">
              <Button size="lg" className="bg-forest-normal hover:bg-forest-normal/90 text-lg px-8">
                Start Growing
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-forest-normal text-forest-normal text-lg px-8">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-forest-dark">Why Memory Forest?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sprout,
                title: 'Plant Memories',
                description: 'Add photos, dates, and emotions to create meaningful memory seeds that grow your personal forest.',
              },
              {
                icon: Trees,
                title: 'Visual Growth',
                description: 'Watch your memories blossom into a beautiful 3D tree visualization that evolves with time.',
              },
              {
                icon: Users,
                title: 'Share & Connect',
                description: 'Tag friends and loved ones to build a shared memory forest and relive moments together.',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="p-8 rounded-lg bg-forest-light/30 border border-forest-normal/10 hover:border-forest-normal/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.2, duration: 0.6 }}
              >
                <feature.icon className="w-12 h-12 text-forest-normal mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-forest-dark">{feature.title}</h3>
                <p className="text-forest-dark/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-forest-normal/10 to-forest-happy/10 p-12 rounded-lg border border-forest-normal/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Heart className="w-12 h-12 text-forest-normal mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4 text-forest-dark">Ready to Grow Your Memory Forest?</h3>
          <p className="text-lg text-forest-dark/70 mb-8">Start planting your cherished moments today and watch them flourish.</p>
          <Link to="/tree">
            <Button size="lg" className="bg-forest-normal hover:bg-forest-normal/90 text-lg px-8">
              Begin Your Journey
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-dark/5 border-t border-forest-normal/10 py-8 px-4 text-center text-forest-dark/60">
        <p>Memory Forest © 2026 · Plant, Revisit, Share</p>
      </footer>
    </div>
  );
}
