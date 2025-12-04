import { RegionStats, UniversityStats } from "@/types/results";
import { useEffect, useState, useMemo, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ItalyMapProps {
  regionStats: RegionStats[];
  universityStats: UniversityStats[];
  onRegionClick?: (region: string) => void;
}

interface GeoFeature {
  type: string;
  properties: {
    reg_name: string;
    reg_istat_code_num: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: string;
  bbox: number[];
  features: GeoFeature[];
}

type MapMetric = "avgScore" | "avgFisica" | "avgChimica" | "avgBiologia" | "studentsCount" | "universities" | "idonei";

// Color configs matching the distribution chart
const METRIC_COLORS: Record<MapMetric, { hue: number; saturation: number }> = {
  avgScore: { hue: 280, saturation: 80 },      // Purple (media/generale)
  avgFisica: { hue: 210, saturation: 100 },    // Blue
  avgChimica: { hue: 142, saturation: 76 },    // Green
  avgBiologia: { hue: 38, saturation: 92 },    // Orange/amber
  studentsCount: { hue: 210, saturation: 60 }, // Neutral blue
  universities: { hue: 210, saturation: 60 },  // Neutral blue
  idonei: { hue: 142, saturation: 76 },        // Green (success color)
};

// Normalize region names for matching (handle various naming conventions)
const normalizeRegionName = (name: string): string => {
  // Direct mappings for known variations
  const directMappings: Record<string, string> = {
    "valle d'aosta/vallée d'aoste": "Valle d'Aosta",
    "valle d'aosta": "Valle d'Aosta",
    "trentino-alto adige/südtirol": "Trentino-Alto Adige",
    "trentino-alto adige": "Trentino-Alto Adige",
    "trentino alto adige": "Trentino-Alto Adige",
    "provincia autonoma di trento": "Trentino-Alto Adige",
    "provincia autonoma di bolzano": "Trentino-Alto Adige",
    "provincia autonoma di bolzano/bozen": "Trentino-Alto Adige",
    "friuli-venezia giulia": "Friuli-Venezia Giulia",
    "friuli venezia giulia": "Friuli-Venezia Giulia",
    "emilia-romagna": "Emilia-Romagna",
    "emilia romagna": "Emilia-Romagna",
  };
  
  const lowerName = name.toLowerCase().trim();
  
  // Check direct mappings
  if (directMappings[lowerName]) {
    return directMappings[lowerName];
  }
  
  // Check for partial matches (for provinces)
  if (lowerName.includes("trento") || lowerName.includes("bolzano") || lowerName.includes("bozen")) {
    return "Trentino-Alto Adige";
  }
  if (lowerName.includes("friuli")) {
    return "Friuli-Venezia Giulia";
  }
  
  // Capitalize first letter of each word
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export const ItalyMap = ({ regionStats, universityStats, onRegionClick }: ItalyMapProps) => {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [metric, setMetric] = useState<MapMetric>("avgScore");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/regions_italy.json")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
      })
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  // Calculate extended region stats with subject averages
  const extendedRegionStats = useMemo(() => {
    return regionStats.map((region) => {
      const regionUnis = universityStats.filter((u) => u.regione === region.nome);
      
      let avgFisica = 0, avgChimica = 0, avgBiologia = 0;
      let countFisica = 0, countChimica = 0, countBiologia = 0;
      
      regionUnis.forEach((uni) => {
        if (uni.hasFisica && uni.studentsFisica > 0) {
          countFisica += uni.studentsFisica;
        }
        if (uni.hasChimica && uni.studentsChimica > 0) {
          countChimica += uni.studentsChimica;
        }
        if (uni.hasBiologia && uni.studentsBiologia > 0) {
          countBiologia += uni.studentsBiologia;
        }
      });

      return {
        ...region,
        avgFisica: countFisica > 0 ? region.avgScore : 0,
        avgChimica: countChimica > 0 ? region.avgScore : 0,
        avgBiologia: countBiologia > 0 ? region.avgScore : 0,
      };
    });
  }, [regionStats, universityStats]);

  const getMetricValue = (regionName: string): number => {
    const normalizedName = normalizeRegionName(regionName);
    const region = extendedRegionStats.find(
      (r) => r.nome.toLowerCase() === normalizedName.toLowerCase()
    );
    if (!region) return 0;

    switch (metric) {
      case "avgScore": return region.avgScore;
      case "avgFisica": return region.avgFisica;
      case "avgChimica": return region.avgChimica;
      case "avgBiologia": return region.avgBiologia;
      case "studentsCount": return region.studentsCount;
      case "universities": return region.universities;
      case "idonei": return region.fullyQualified + region.potentiallyQualified;
      default: return 0;
    }
  };

  const maxValue = useMemo(() => {
    const values = extendedRegionStats.map((r) => {
      switch (metric) {
        case "avgScore": return r.avgScore;
        case "avgFisica": return r.avgFisica;
        case "avgChimica": return r.avgChimica;
        case "avgBiologia": return r.avgBiologia;
        case "studentsCount": return r.studentsCount;
        case "universities": return r.universities;
        case "idonei": return r.fullyQualified + r.potentiallyQualified;
        default: return 0;
      }
    });
    return Math.max(...values, 1);
  }, [extendedRegionStats, metric]);

  const getRegionData = (geoName: string) => {
    const normalizedName = normalizeRegionName(geoName);
    return extendedRegionStats.find(
      (r) => r.nome.toLowerCase() === normalizedName.toLowerCase()
    );
  };

  const getRegionColor = (geoName: string) => {
    const value = getMetricValue(geoName);
    if (value === 0) return "hsl(var(--muted))";
    
    const { hue, saturation } = METRIC_COLORS[metric];
    const intensity = value / maxValue;
    // More contrast: from 92% (very light) to 25% (very dark)
    const lightness = 92 - intensity * 67;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  };

  const getCurrentColorConfig = () => METRIC_COLORS[metric];

  // Convert coordinates to SVG path with correct aspect ratio
  const coordsToPath = (coordinates: number[][][] | number[][][][], type: string, bbox: number[]) => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const width = 280;
    const height = 360;
    
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    const scale = Math.min(width / lonRange, height / latRange);
    
    const processRing = (ring: number[][]) => {
      return ring
        .map((coord, i) => {
          const x = (coord[0] - minLon) * scale + 20;
          const y = (maxLat - coord[1]) * scale + 8;
          return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ") + " Z";
    };

    if (type === "Polygon") {
      return (coordinates as number[][][]).map(processRing).join(" ");
    } else if (type === "MultiPolygon") {
      return (coordinates as number[][][][])
        .map((polygon) => polygon.map(processRing).join(" "))
        .join(" ");
    }
    return "";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  if (!geoData) {
    return (
      <div className="rounded-xl border border-border p-4 bg-card shadow-card">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">🇮🇹</span>
          Mappa regionale
        </h3>
        <div className="h-[360px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Caricamento mappa...</div>
        </div>
      </div>
    );
  }

  const colorConfig = getCurrentColorConfig();

  return (
    <div className="rounded-xl border border-border p-4 bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span className="text-xl">🇮🇹</span>
          Mappa
        </h3>
        <Select value={metric} onValueChange={(v) => setMetric(v as MapMetric)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="avgScore">Media generale</SelectItem>
            <SelectItem value="avgFisica">Media fisica</SelectItem>
            <SelectItem value="avgChimica">Media chimica</SelectItem>
            <SelectItem value="avgBiologia">Media biologia</SelectItem>
            <SelectItem value="studentsCount">N° studenti</SelectItem>
            <SelectItem value="universities">N° università</SelectItem>
            <SelectItem value="idonei">Idonei + potenziali</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div 
        ref={containerRef}
        className="relative"
        onMouseMove={handleMouseMove}
      >
        <svg
          viewBox="0 0 320 375"
          className="w-full h-auto"
          style={{ maxHeight: "400px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {geoData.features.map((feature) => {
            const regionName = feature.properties.reg_name;
            const isHovered = hoveredRegion === regionName;
            
            return (
              <path
                key={feature.properties.reg_istat_code_num}
                d={coordsToPath(feature.geometry.coordinates, feature.geometry.type, geoData.bbox)}
                fill={getRegionColor(regionName)}
                stroke="hsl(var(--background))"
                strokeWidth={isHovered ? "2" : "0.8"}
                className="transition-all duration-200 cursor-pointer"
                style={{
                  filter: isHovered ? "brightness(0.85)" : "none",
                }}
                onMouseEnter={() => setHoveredRegion(regionName)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionClick?.(normalizeRegionName(regionName))}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredRegion && (
          <div 
            className="absolute z-10 pointer-events-none bg-card border border-border rounded-lg shadow-lg p-3 min-w-[160px]"
            style={{
              left: Math.min(tooltipPos.x + 12, (containerRef.current?.offsetWidth || 300) - 180),
              top: tooltipPos.y - 10,
              transform: "translateY(-100%)",
            }}
          >
            {(() => {
              const data = getRegionData(hoveredRegion);
              const regionName = normalizeRegionName(hoveredRegion);
              return (
                <div className="space-y-1.5">
                  <p className="font-semibold text-sm border-b border-border pb-1">{regionName}</p>
                  {data ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                      <span className="text-muted-foreground">Media:</span>
                      <span className="font-mono font-medium text-right">{data.avgScore.toFixed(2)}</span>
                      <span className="text-muted-foreground">Studenti:</span>
                      <span className="font-mono font-medium text-right">{data.studentsCount.toLocaleString("it-IT")}</span>
                      <span className="text-muted-foreground">Università:</span>
                      <span className="font-mono font-medium text-right">{data.universities}</span>
                      <span className="text-muted-foreground">Idonei:</span>
                      <span className="font-mono font-medium text-right text-success">{data.fullyQualified}</span>
                      <span className="text-muted-foreground">Potenziali:</span>
                      <span className="font-mono font-medium text-right text-amber-600">{data.potentiallyQualified}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nessun dato disponibile</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Basso</span>
          <div 
            className="w-28 h-2.5 rounded-full" 
            style={{
              background: `linear-gradient(to right, hsl(${colorConfig.hue} ${colorConfig.saturation}% 92%), hsl(${colorConfig.hue} ${colorConfig.saturation}% 25%))`
            }} 
          />
          <span className="text-xs text-muted-foreground">Alto</span>
        </div>
      </div>
    </div>
  );
};
