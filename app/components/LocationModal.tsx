"use client";

import { useState, useEffect } from 'react';
import { MapPin, Search, X, ChevronRight, ArrowLeft, Check } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { regionId: string; subRegionId: string; label: string }) => void;
}

export default function LocationModal({ isOpen, onClose, onSelectLocation }: LocationModalProps) {
  const [regions, setRegions] = useState<any[]>([]);
  const [subRegions, setSubRegions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState<any>(null);
  const [loadingLgas, setLoadingLgas] = useState(false);

  useEffect(() => {
    if (!isOpen || regions.length > 0) return;
    fetch(`${API_URL}/locations/countries/1/regions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setRegions(data);
      })
      .catch(() => console.error('Failed to load regions'));
  }, [isOpen, regions.length]);

  if (!isOpen) return null;

  const handleLoadLgas = async (region: any) => {
    setActiveRegion(region);
    setLoadingLgas(true);
    try {
      const res = await fetch(`${API_URL}/locations/regions/${region.id}/sub-regions`);
      const data = res.ok ? await res.json() : [];
      setSubRegions(data);
    } catch {
      setSubRegions([]);
    } finally {
      setLoadingLgas(false);
    }
  };

  const handleClear = () => {
    onSelectLocation({ regionId: '', subRegionId: '', label: 'All Nigeria' });
    setActiveRegion(null);
    setSearch('');
    onClose();
  };

  const handleSelectState = (region: any) => {
    onSelectLocation({
      regionId: String(region.id),
      subRegionId: '',
      label: region.name.replace(' State', ''),
    });
    setActiveRegion(null);
    setSearch('');
    onClose();
  };

  const handleSelectLga = (sub: any, region: any) => {
    onSelectLocation({
      regionId: String(region.id),
      subRegionId: String(sub.id),
      label: `${sub.name}, ${region.name.replace(' State', '')}`,
    });
    setActiveRegion(null);
    setSearch('');
    onClose();
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-0 shadow-2xl relative flex flex-col max-h-[85vh] text-gray-900">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <button
            type="button"
            onClick={handleClear}
            className="font-bold text-gray-900 hover:text-brand-orange flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <MapPin className="w-5 h-5 text-brand-orange" /> All Nigeria
          </button>

          {!activeRegion && (
            <div className="relative w-72 hidden md:block">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find state or LGA..."
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand-orange"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Regions / LGAs Grid */}
        <div className="p-6 overflow-y-auto bg-gray-50 rounded-b-2xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {!activeRegion ? (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="col-span-full text-left px-4 py-3 text-sm font-bold text-brand-orange bg-orange-50 border border-orange-200 rounded-xl mb-2 flex items-center justify-between shadow-sm"
                >
                  <span>🌐 All Nigeria (Reset Filter)</span>
                  <Check className="w-4 h-4" />
                </button>

                {filteredRegions.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center bg-white border border-gray-200 hover:border-brand-orange rounded-xl overflow-hidden transition group"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectState(r)}
                      className="flex-1 text-left px-4 py-3 text-sm font-semibold text-gray-700 group-hover:text-brand-orange truncate"
                    >
                      {r.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadLgas(r)}
                      className="px-3 py-3 text-gray-400 hover:text-brand-orange hover:bg-gray-50 border-l border-gray-100 transition"
                      title="View LGAs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="col-span-full flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setActiveRegion(null)}
                    className="text-xs font-bold text-brand-orange flex items-center gap-1 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to all states
                  </button>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {activeRegion.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectState(activeRegion)}
                  className="col-span-full text-left px-4 py-3 text-sm font-bold text-gray-900 bg-orange-50 border border-orange-200 rounded-xl mb-2 flex items-center justify-between"
                >
                  <span>All {activeRegion.name}</span>
                  <Check className="w-4 h-4 text-brand-orange" />
                </button>

                {loadingLgas ? (
                  <div className="col-span-full py-8 text-center text-gray-400 font-medium">
                    Loading LGAs for {activeRegion.name}...
                  </div>
                ) : (
                  subRegions.map((sr) => (
                    <button
                      key={sr.id}
                      type="button"
                      onClick={() => handleSelectLga(sr, activeRegion)}
                      className="text-left px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-brand-orange hover:text-brand-orange rounded-xl transition flex justify-between items-center"
                    >
                      <span className="truncate">{sr.name}</span>
                      <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}