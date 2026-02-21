import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Leaf, Image as ImageIcon, X, CalendarDays, Users } from 'lucide-react';
import { Memory, Emotion } from '@/types/memory';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface PlantSeedFormProps {
  onPlant: (memory: Omit<Memory, 'id' | 'timestamp'>) => void;
  connections?: string[];
}

const EMOTIONS: { value: Emotion; label: string }[] = [
  { value: 'Normal', label: '🌿 Normal' },
  { value: 'Happy', label: '✨ Happy' },
  { value: 'Sad', label: '💧 Sad' },
  { value: 'Special', label: '⭐ Special' },
];

export function PlantSeedForm({ onPlant, connections = [] }: PlantSeedFormProps) {
  const [isCollection, setIsCollection] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('Normal');
  const [memoryDate, setMemoryDate] = useState<string>('');
  const [taggedConnections, setTaggedConnections] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      newUrls.push(URL.createObjectURL(file));
    });
    if (isCollection) {
      setImageUrls((prev) => [...prev, ...newUrls]);
    } else {
      setImageUrls(newUrls.slice(0, 1));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAllImages = () => {
    setImageUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleConnection = (name: string) => {
    setTaggedConnections((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrls.length === 0 || !description.trim() || !memoryDate) return;
    onPlant({
      imageUrl: imageUrls[0],
      imageUrls,
      isCollection: isCollection && imageUrls.length > 1,
      description: description.trim(),
      emotion,
      memoryDate,
      connections: taggedConnections.length > 0 ? taggedConnections : undefined,
    });
    setImageUrls([]);
    setDescription('');
    setEmotion('Normal');
    setMemoryDate('');
    setTaggedConnections([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isValid = imageUrls.length > 0 && !!description.trim() && !!memoryDate;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 h-full overflow-y-auto"
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

      {/* Upload Mode Toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Memory Type
        </label>
        <ToggleGroup
          type="single"
          value={isCollection ? 'collection' : 'single'}
          onValueChange={(v) => {
            if (v) {
              const next = v === 'collection';
              setIsCollection(next);
              if (!next && imageUrls.length > 1) {
                setImageUrls(imageUrls.slice(0, 1));
              }
            }
          }}
          className="w-full grid grid-cols-2 gap-0 bg-muted rounded-lg p-1 border border-border"
        >
          <ToggleGroupItem
            value="single"
            className="text-xs py-2 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
          >
            🍃 Single Leaf
          </ToggleGroupItem>
          <ToggleGroupItem
            value="collection"
            className="text-xs py-2 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
          >
            🌿 Vine Collection
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isCollection ? 'Collection Images' : 'Memory Image'}
        </label>
        {imageUrls.length === 0 ? (
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
              multiple={isCollection}
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drop {isCollection ? 'images' : 'an image'} or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/60">
                {isCollection ? 'Select multiple images for a vine' : 'JPG, PNG, GIF up to 20MB'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className={`grid ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
              {imageUrls.map((url, i) => (
                <motion.div
                  key={i}
                  className="relative rounded-xl overflow-hidden border border-border aspect-square"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background border border-border transition-colors"
                  >
                    <X className="w-3 h-3 text-foreground" />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-foreground/70" />
                <span className="text-xs text-foreground/70">
                  {imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} ready
                </span>
              </div>
              <div className="flex gap-2">
                {isCollection && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add more
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
            {/* Hidden file input for "Add more" */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={isCollection}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Date of Memory */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Date of Memory
        </label>
        <input
          type="date"
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full rounded-lg bg-muted border border-border text-sm text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
        />
        {memoryDate && (
          <p className="text-xs text-muted-foreground">
            {new Date(memoryDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
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

      {/* Tag Connections */}
      {connections.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Tag Connections
          </label>
          <div className="flex flex-wrap gap-2">
            {connections.map((c) => (
              <motion.button
                key={c}
                type="button"
                onClick={() => toggleConnection(c)}
                whileTap={{ scale: 0.95 }}
                className={`text-xs py-1.5 px-3 rounded-full border transition-all duration-200 ${
                  taggedConnections.includes(c)
                    ? 'border-accent bg-accent/20 text-accent-foreground'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
                }`}
              >
                {taggedConnections.includes(c) ? '✓ ' : ''}{c}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="mt-auto pt-2">
        <motion.button
          type="submit"
          disabled={!isValid}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
        >
          <Leaf className="w-4 h-4" />
          {isCollection ? 'Plant Vine Collection' : 'Plant Memory'}
        </motion.button>
        {!isValid && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {imageUrls.length === 0 ? 'Add an image' : !memoryDate ? 'Pick a date' : 'Add a description'} to continue
          </p>
        )}
      </div>
    </motion.form>
  );
}
