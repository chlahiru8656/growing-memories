import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Leaf, Image as ImageIcon, X } from 'lucide-react';
import { Memory, Emotion } from '@/types/memory';
import { Button } from '@/components/ui/button';

interface PlantSeedFormProps {
  onPlant: (memory: Omit<Memory, 'id' | 'timestamp'>) => void;
}

const EMOTIONS: { value: Emotion; label: string; color: string }[] = [
  { value: 'Normal', label: '🌿 Normal', color: 'border-forest-normal' },
  { value: 'Happy', label: '✨ Happy', color: 'border-forest-happy' },
  { value: 'Sad', label: '💧 Sad', color: 'border-forest-sad' },
  { value: 'Special', label: '⭐ Special', color: 'border-forest-special' },
];

export function PlantSeedForm({ onPlant }: PlantSeedFormProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('Normal');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !description.trim()) return;
    onPlant({ imageUrl, description: description.trim(), emotion });
    setImageUrl('');
    setImagePreview('');
    setDescription('');
    setEmotion('Normal');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/20">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg text-foreground">Plant a Seed</h2>
          <p className="text-xs text-muted-foreground">Each memory grows your tree</p>
        </div>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Memory Image
        </label>
        {!imagePreview ? (
          <motion.div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
              isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60 hover:bg-muted/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drop an image or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, GIF up to 20MB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="relative rounded-xl overflow-hidden border border-border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/60 to-transparent flex items-end px-2 pb-1">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-foreground/70" />
                <span className="text-xs text-foreground/70">Image ready</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this memory mean to you..."
          rows={3}
          className="w-full rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      {/* Emotion */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Emotion
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EMOTIONS.map((e) => (
            <motion.button
              key={e.value}
              type="button"
              onClick={() => setEmotion(e.value)}
              whileTap={{ scale: 0.95 }}
              className={`text-sm py-2 px-3 rounded-lg border-2 transition-all duration-200 font-body text-left ${
                emotion === e.value
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
              }`}
            >
              {e.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="mt-auto pt-2">
        <motion.button
          type="submit"
          disabled={!imageUrl || !description.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
        >
          <Leaf className="w-4 h-4" />
          Plant Memory
        </motion.button>
      </div>
    </motion.form>
  );
}
