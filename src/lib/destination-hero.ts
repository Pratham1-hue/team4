import { CITIES, PLACES, IMG } from "./data";
import type { TiltedGridImage } from "@/components/ui/tilted-grid-hero";

/**
 * Returns dynamic curved-cylinder photography for any selected destination.
 * Supports exact cities (Jaipur, Bali, Kyoto, Goa, Paris, Lisbon), regions (Alps, Mountains),
 * and dynamic scenic fallbacks.
 */
export function getDestinationHeroImages(destination?: string): TiltedGridImage[] {
  if (!destination || !destination.trim()) {
    return [
      { src: IMG.jaipur, alt: "Jaipur, India" },
      { src: IMG.bali, alt: "Bali, Indonesia" },
      { src: IMG.kyoto, alt: "Kyoto, Japan" },
      { src: IMG.paris, alt: "Paris, France" },
      { src: IMG.goa, alt: "Goa, India" },
      { src: IMG.lisbon, alt: "Lisbon, Portugal" },
      { src: IMG.mountains, alt: "Swiss Alps" },
      { src: IMG.lake, alt: "Lakefront" },
      { src: IMG.bamboo, alt: "Arashiyama Bamboo" },
      { src: IMG.hawa, alt: "Hawa Mahal" },
    ];
  }

  const query = destination.toLowerCase().trim();

  if (query.includes("jaipur") || query.includes("rajasthan")) {
    const places = PLACES.filter((p) => p.city.toLowerCase() === "jaipur");
    return [
      { src: IMG.jaipur, alt: "Amber Fort" },
      { src: IMG.hawa, alt: "Hawa Mahal" },
      { src: IMG.palace, alt: "City Palace" },
      { src: IMG.indiaFood, alt: "Jaipur Delicacies" },
      { src: IMG.market, alt: "Johari Bazaar" },
      ...places.map((p) => ({ src: p.image, alt: p.name })),
    ];
  }

  if (query.includes("bali") || query.includes("indonesia") || query.includes("ubud")) {
    const places = PLACES.filter((p) => p.city.toLowerCase() === "bali");
    return [
      { src: IMG.bali, alt: "Bali Beach" },
      { src: IMG.baliRice, alt: "Tegallalang Rice Terrace" },
      { src: IMG.temple, alt: "Tanah Lot Temple" },
      { src: IMG.sunset, alt: "Uluwatu Sunset" },
      { src: IMG.spa, alt: "Bali Luxury Spa" },
      ...places.map((p) => ({ src: p.image, alt: p.name })),
    ];
  }

  if (query.includes("kyoto") || query.includes("japan") || query.includes("tokyo")) {
    const places = PLACES.filter((p) => p.city.toLowerCase() === "kyoto");
    return [
      { src: IMG.kyoto, alt: "Kyoto Kinkaku-ji" },
      { src: IMG.bamboo, alt: "Arashiyama Bamboo Grove" },
      { src: IMG.shrine, alt: "Fushimi Inari Torii" },
      { src: IMG.cafe, alt: "Gion Traditional Tea" },
      ...places.map((p) => ({ src: p.image, alt: p.name })),
    ];
  }

  if (query.includes("goa") || query.includes("beach")) {
    const places = PLACES.filter((p) => p.city.toLowerCase() === "goa");
    return [
      { src: IMG.goa, alt: "Goa Beachfront" },
      { src: IMG.beach, alt: "Palolem Beach" },
      { src: IMG.sunset, alt: "Chapora Sunset" },
      { src: IMG.restaurant, alt: "Beach Shack Dinner" },
      ...places.map((p) => ({ src: p.image, alt: p.name })),
    ];
  }

  if (query.includes("paris") || query.includes("france")) {
    return [
      { src: IMG.paris, alt: "Parisian Boulevards" },
      { src: IMG.cafe, alt: "Le Marais Cafe" },
      { src: IMG.restaurant, alt: "French Bistro" },
      { src: IMG.market2, alt: "Marché d'Aligre" },
      { src: IMG.sunset, alt: "Seine Sunset" },
    ];
  }

  if (query.includes("lisbon") || query.includes("portugal")) {
    return [
      { src: IMG.lisbon, alt: "Lisbon Alfama" },
      { src: IMG.sunset, alt: "Miradouro Sunset" },
      { src: IMG.cafe, alt: "Pastéis de Belém" },
      { src: IMG.market, alt: "Time Out Market" },
    ];
  }

  if (query.includes("swiss") || query.includes("mountain") || query.includes("alps") || query.includes("manali") || query.includes("ladakh")) {
    return [
      { src: IMG.mountains, alt: "Alpine Peaks" },
      { src: IMG.lake, alt: "Glacial Lake" },
      { src: IMG.hike, alt: "Mountain Ridge Trail" },
      { src: IMG.sunset, alt: "Alpine Glow" },
    ];
  }

  return [
    { src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80", alt: destination },
    { src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80", alt: destination },
    { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", alt: destination },
    { src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80", alt: destination },
    { src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80", alt: destination },
    { src: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80", alt: destination },
  ];
}

