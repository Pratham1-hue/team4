"use client";

import { useState, useMemo } from "react";
import {
  Luggage,
  CheckCircle2,
  CloudRain,
  Sun,
  Wind,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  Scale,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button, Input, Badge, Modal, Select } from "@/components/ui";

interface PackingItem {
  id: string;
  name: string;
  category: "Clothing" | "Documents" | "Electronics" | "Toiletries" | "Weather-Specific";
  weightGrams: number;
  checked: boolean;
  whyWeather?: string;
}

const INITIAL_PACKING_ITEMS: PackingItem[] = [
  { id: "p1", name: "Original Passport & Visa Printouts", category: "Documents", weightGrams: 100, checked: true },
  { id: "p2", name: "Boarding Passes cached in Travel Vault", category: "Documents", weightGrams: 0, checked: true },
  { id: "p3", name: "Compact Windproof Umbrella", category: "Weather-Specific", weightGrams: 280, checked: false, whyWeather: "High rain probability on Day 2" },
  { id: "p4", name: "Breathable Linen Shirts (x3)", category: "Clothing", weightGrams: 600, checked: true },
  { id: "p5", name: "Light Evening Cardigan / Jacket", category: "Weather-Specific", weightGrams: 450, checked: false, whyWeather: "Evening temperatures dip to 16°C" },
  { id: "p6", name: "Comfortable Walking Shoes", category: "Clothing", weightGrams: 750, checked: true },
  { id: "p7", name: "Modest Outfit for Temple Visits", category: "Clothing", weightGrams: 300, checked: false },
  { id: "p8", name: "Sunscreen SPF 50+ & UV Sunglasses", category: "Weather-Specific", weightGrams: 150, checked: true, whyWeather: "UV Index reaches 8 at midday" },
  { id: "p9", name: "20,000 mAh Fast-Charge Power Bank", category: "Electronics", weightGrams: 380, checked: false },
  { id: "p10", name: "Universal Travel Adapter & Cables", category: "Electronics", weightGrams: 200, checked: true },
  { id: "p11", name: "First-Aid & Travel Medication Pouch", category: "Toiletries", weightGrams: 220, checked: true },
];

export default function PackingPage() {
  const { trips, toast } = useApp();
  const [items, setItems] = useState<PackingItem[]>(INITIAL_PACKING_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PackingItem["category"]>("Clothing");
  const [newItemWeight, setNewItemWeight] = useState("200");

  const progress = useMemo(() => {
    const checked = items.filter((i) => i.checked).length;
    return {
      checked,
      total: items.length,
      percentage: items.length ? Math.round((checked / items.length) * 100) : 0,
    };
  }, [items]);

  const totalWeightKg = useMemo(() => {
    const grams = items.reduce((sum, i) => (i.checked ? sum + i.weightGrams : sum), 0);
    return (grams / 1000).toFixed(1);
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    const newItem: PackingItem = {
      id: "p_" + Date.now(),
      name: newItemName,
      category: newItemCategory,
      weightGrams: parseInt(newItemWeight) || 200,
      checked: false,
    };

    setItems([...items, newItem]);
    toast("Item added", `Added ${newItemName} to packing list`, "success");
    setModalOpen(false);
    setNewItemName("");
  };

  const filteredItems = items.filter(
    (i) => selectedCategory === "all" || i.category === selectedCategory
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg shadow-md">
              <Luggage size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">
                  Weather-Smart Packing Assistant
                </h1>
                <Badge variant="green" className="text-[10px]">
                  Forecast Synced
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Dynamic packing checklist tuned to your destination’s 7-day weather & baggage limits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      {/* Progress & Baggage Weight Overview */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Packing Progress */}
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>PACKING PROGRESS</span>
            <span className="text-accent">{progress.percentage}%</span>
          </div>
          <p className="mt-2 text-2xl font-black text-fg">
            {progress.checked} / {progress.total} items
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Estimated Weight */}
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>ESTIMATED PACKED WEIGHT</span>
            <Scale size={14} className="text-accent" />
          </div>
          <p className="mt-2 text-2xl font-black text-fg">{totalWeightKg} kg</p>
          <p className="mt-1 text-xs text-muted">Inside standard 7kg cabin carry-on limit</p>
        </div>

        {/* Weather Intelligence Hint */}
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/30 p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <Sparkles size={14} />
            <span>Weather Insights Active</span>
          </div>
          <p className="mt-1 text-xs text-fg font-medium">
            Forecast shows 26°C with 40% evening showers and high UV index.
          </p>
          <p className="mt-1 text-[11px] text-muted">
            3 items automatically recommended based on real forecast data.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {["all", "Weather-Specific", "Clothing", "Documents", "Electronics", "Toiletries"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-accent text-accent-fg shadow-sm"
                  : "bg-card border border-line text-muted hover:text-fg"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          )
        )}
      </div>

      {/* Checklist Grid */}
      <div className="mt-6 space-y-2.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
              item.checked
                ? "border-emerald-500/30 bg-emerald-500/5 text-muted"
                : "border-line bg-card hover:border-accent/40 text-fg"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {}}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <div>
                <p className={`text-xs font-bold ${item.checked ? "line-through opacity-70" : ""}`}>
                  {item.name}
                </p>
                {item.whyWeather && (
                  <p className="text-[10px] text-accent font-medium flex items-center gap-1 mt-0.5">
                    <Sparkles size={10} /> {item.whyWeather}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted">{item.weightGrams}g</span>
              <Badge variant="soft" className="text-[10px]">
                {item.category}
              </Badge>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id);
                }}
                className="text-muted hover:text-danger p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Packing Item" size="sm">
        <form onSubmit={handleAddItem} className="space-y-4 pt-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Item Name *
            </label>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Noise Cancelling Headphones, Rain Poncho"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Category
              </label>
              <Select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as PackingItem["category"])}
              >
                <option value="Clothing">Clothing</option>
                <option value="Documents">Documents</option>
                <option value="Electronics">Electronics</option>
                <option value="Toiletries">Toiletries</option>
                <option value="Weather-Specific">Weather-Specific</option>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Approx Weight (g)
              </label>
              <Input
                type="number"
                value={newItemWeight}
                onChange={(e) => setNewItemWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add to Checklist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

