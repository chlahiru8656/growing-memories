import { motion } from 'framer-motion';
import { Trees, Leaf, Users, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function About() {
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
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/tree">
              <Button className="bg-forest-normal hover:bg-forest-normal/90">Enter App</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-16 px-4 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 text-forest-dark">About Memory Forest</h1>
          <p className="text-xl text-forest-dark/60">Preserving life's precious moments in an ever-growing memory tree</p>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Mission */}
          <motion.div
            className="bg-white rounded-lg p-8 border border-forest-normal/10 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex gap-4 mb-4">
              <Leaf className="w-8 h-8 text-forest-normal flex-shrink-0" />
              <h2 className="text-3xl font-bold text-forest-dark">Our Mission</h2>
            </div>
            <p className="text-forest-dark/70 leading-relaxed">
              We believe that memories are the foundation of meaningful connections. Memory Forest transforms the way you preserve and celebrate life's precious moments by creating a living, visual representation of your personal history—a tree that grows with every memory you plant.
            </p>
          </motion.div>

          {/* How It Works */}
          <motion.div
            className="bg-white rounded-lg p-8 border border-forest-normal/10 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="flex gap-4 mb-4">
              <Sparkles className="w-8 h-8 text-forest-normal flex-shrink-0" />
              <h2 className="text-3xl font-bold text-forest-dark">How It Works</h2>
            </div>
            <div className="space-y-4 text-forest-dark/70">
              <p>
                <strong className="text-forest-dark">1. Plant a Seed:</strong> Add a photo, write a description, and capture the emotion of the moment. Each memory becomes a seed in your personal forest.
              </p>
              <p>
                <strong className="text-forest-dark">2. Watch It Grow:</strong> Your memories are visualized as a beautiful, interactive 3D tree. The tree evolves as you add more memories, creating a unique representation of your life story.
              </p>
              <p>
                <strong className="text-forest-dark">3. Share & Connect:</strong> Tag friends and loved ones to build shared memory forests. Relive moments together and strengthen your connections.
              </p>
              <p>
                <strong className="text-forest-dark">4. Revisit Anytime:</strong> Explore your memory tree in different ways—by season, emotion, or timeline—and reconnect with what matters most.
              </p>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            className="bg-white rounded-lg p-8 border border-forest-normal/10 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="flex gap-4 mb-4">
              <Trees className="w-8 h-8 text-forest-normal flex-shrink-0" />
              <h2 className="text-3xl font-bold text-forest-dark">Key Features</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Clock, title: 'Timeline View', desc: 'Browse memories chronologically or by season' },
                { icon: Leaf, title: '3D Memory Tree', desc: 'Visualize your life story as a growing tree' },
                { icon: Users, title: 'Friend Tagging', desc: 'Share memories with friends and loved ones' },
                { icon: Sparkles, title: 'Emotion Tracking', desc: 'Categorize memories by emotional significance' },
              ].map((feature, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <feature.icon className="w-5 h-5 text-forest-normal flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-forest-dark">{feature.title}</h3>
                      <p className="text-sm text-forest-dark/60">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            className="bg-white rounded-lg p-8 border border-forest-normal/10 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex gap-4 mb-4">
              <Users className="w-8 h-8 text-forest-normal flex-shrink-0" />
              <h2 className="text-3xl font-bold text-forest-dark">Our Vision</h2>
            </div>
            <p className="text-forest-dark/70 leading-relaxed">
              Growing Memories is built on the belief that the most important things in life are the moments we share with the people we love. We're committed to providing a beautiful, intuitive platform that makes preserving and celebrating those moments effortless.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <h3 className="text-3xl font-bold mb-4 text-forest-dark">Ready to Start Growing?</h3>
          <p className="text-lg text-forest-dark/60 mb-8">Begin planting your memories and create your personal memory forest today.</p>
          <Link to="/tree">
            <Button size="lg" className="bg-forest-normal hover:bg-forest-normal/90 text-lg px-8">
              Enter Memory Forest
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
