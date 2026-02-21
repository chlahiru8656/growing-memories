import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trees, Sprout } from 'lucide-react';
import { UserProfile, calculateAge } from '@/types/memory';

interface AuthGateProps {
  onEnter: (profile: UserProfile) => void;
}

const DEFAULT_CONNECTIONS = ['Nadun', 'Sakuni', 'Sewmni'];

export function AuthGate({ onEnter }: AuthGateProps) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const isValid = name.trim().length >= 2 && !!birthdate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onEnter({
      name: name.trim(),
      birthdate,
      age: calculateAge(birthdate),
      connections: DEFAULT_CONNECTIONS,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-2xl border border-border p-8 flex flex-col items-center gap-6"
        style={{
          background: 'linear-gradient(135deg, hsl(150 18% 10% / 0.95), hsl(180 18% 8% / 0.98))',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <motion.div
          className="p-4 rounded-2xl bg-primary/15 border border-primary/20"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Trees className="w-10 h-10 text-primary" />
        </motion.div>

        <div className="text-center">
          <h1 className="font-display text-2xl text-foreground">Memory Forest</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your forest</p>
        </div>

        {/* Name */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full rounded-lg bg-muted border border-border text-sm text-foreground px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Birthdate */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg bg-muted border border-border text-sm text-foreground px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
          />
          {birthdate && (
            <p className="text-xs text-muted-foreground">
              Age: {calculateAge(birthdate)} years · Your tree awaits 🌳
            </p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!isValid}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2 mt-2"
        >
          <Sprout className="w-4 h-4" />
          Enter the Forest
        </motion.button>
      </motion.form>
    </div>
  );
}
