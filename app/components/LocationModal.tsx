'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, ChevronRight, ChevronLeft, Search, Check } from 'lucide-react';
// @ts-expect-error nigeria-geo-core ships JS without bundled d.ts
import { getStates, getLGAsByState } from '@some19ice/nigeria-geo-core';

interface LocationSelection {
  regionId: string;
  subRegionId: string;
  label: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (selection: LocationSelection) => void;
}

interface BackendSubRegion {
  id: number;
  name: string;
}

interface BackendRegion {
  id: number;
  name: string;
  sub_regions?: BackendSubRegion[];
  SubRegions?: BackendSubRegion[];
}

interface GeoStateItem {
  id: string;
  name: string;
  lgas: { id: string; name: string }[];
}

export default function LocationModal({
  isOpen,
  onClose,
  onSelectLocation,
}: LocationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<GeoStateItem | null>(null);
  const [backendRegions, setBackendRegions] = useState<BackendRegion[]>([]);

  // Build complete 36 States + FCT & 774 LGAs list locally for zero-latency browsing
  const allNigeriaStates: GeoStateItem[] = useMemo(() => {
    const rawStates = getStates() || [];
    return rawStates
      .map((st: { id: string; name: string }) => {
        const displayName =
          st.name === 'Federal Capital Territory' ? 'Abuja (FCT)' : st.name;
        const lgas = (getLGAsByState(st.id) || []).map(
          (lga: { id: string; name: string }) => ({
            id: String(lga.id),
            name: lga.name,
          })
        );
        return {
          id: String(st.id),
          name: displayName,
          lgas,
        };
      })
      .sort((a: GeoStateItem, b: GeoStateItem) => a.name.localeCompare(b.name));
  }, []);

  // Fetch PostgreSQL Region/SubRegion IDs so URL filters match database IDs
  useEffect(() => {
    if (!isOpen) return;
    fetch('https://ji-africa-backend.onrender.com/api/regions')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setBackendRegions(data);
        else if (Array.isArray(data?.regions)) setBackendRegions(data.regions);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedState(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const findDbIds = (stateName: string, lgaName?: string) => {
    const matchedRegion = backendRegions.find(
      (r) => r.name.trim().toLowerCase() === stateName.trim().toLowerCase()
    );
    const regionId = matchedRegion ? String(matchedRegion.id) : '';
    let subRegionId = '';

    if (matchedRegion && lgaName) {
      const subs = matchedRegion.sub_regions || matchedRegion.SubRegions || [];
      const matchedSub = subs.find(
        (s) => s.name.trim().toLowerCase() === lgaName.trim().toLowerCase()
      );
      if (matchedSub) subRegionId = String(matchedSub.id);
    }

    return { regionId, subRegionId };
  };

  const handleSelectAllNigeria = () => {
    onSelectLocation({ regionId: '', subRegionId: '', label: 'All Nigeria' });
    onClose();
  };

  const handleSelectWholeState = (state: GeoStateItem) => {
    const { regionId } = findDbIds(state.name);
    onSelectLocation({
      regionId,
      subRegionId: '',
      label: state.name,
    });
    onClose();
  };

  const handleSelectLGA = (state: GeoStateItem, lgaName: string) => {
    const { regionId, subRegionId } = findDbIds(state.name, lgaName);
    onSelectLocation({
      regionId,
      subRegionId,
      label: `${lgaName}, ${state.name}`,
    });
    onClose();
  };

  const q = searchTerm.trim().toLowerCase();

  const filteredStates = q
    ? allNigeriaStates.filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.lgas.some((l) => l.name.toLowerCase().includes(q))
      )
    : allNigeriaStates;

  const filteredLgas = selectedState
    ? selectedState.lgas.filter((l) => l.name.toLowerCase().includes(q))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden text-gray-900">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            {selectedState && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState(null);
                  setSearchTerm('');
                }}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition"
                title="Back to all states"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <MapPin className="w-5 h-5 text-brand-orange" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {selectedState ? selectedState.name : 'Select Location'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {selectedState
                  ? `${selectedState.lgas.length} Local Government Areas`
                  : '36 States + Abuja (FCT) • 774 LGAs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Box */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                selectedState
                  ? `Search LGAs in ${selectedState.name}...`
                  : 'Search state or LGA (e.g., Ikeja, Kaduna, Wuse)...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange transition"
            />
          </div>
        </div>

        {/* List Body */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
          {!selectedState ? (
            <>
              <button
                type="button"
                onClick={handleSelectAllNigeria}
                className="w-full px-5 py-3 text-left text-sm font-bold text-brand-orange hover:bg-orange-50 flex items-center justify-between transition"
              >
                <span>All Nigeria</span>
                <Check className="w-4 h-4" />
              </button>

              {filteredStates.map((state) => (
                <button
                  key={state.id}
                  type="button"
                  onClick={() => {
                    setSelectedState(state);
                    setSearchTerm('');
                  }}
                  className="w-full px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center justify-between transition"
                >
                  <span>{state.name}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    {state.lgas.length} LGAs
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              ))}

              {filteredStates.length === 0 && (
                <p className="px-5 py-8 text-center text-xs text-gray-400">
                  No state or LGA matched &ldquo;{searchTerm}&rdquo;.
                </p>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSelectWholeState(selectedState)}
                className="w-full px-5 py-3 text-left text-sm font-bold text-brand-orange hover:bg-orange-50 flex items-center justify-between transition"
              >
                <span>All of {selectedState.name}</span>
                <Check className="w-4 h-4" />
              </button>

              {filteredLgas.map((lga) => (
                <button
                  key={lga.id}
                  type="button"
                  onClick={() => handleSelectLGA(selectedState, lga.name)}
                  className="w-full px-5 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-brand-orange flex items-center justify-between transition"
                >
                  <span>{lga.name}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}

              {filteredLgas.length === 0 && (
                <p className="px-5 py-8 text-center text-xs text-gray-400">
                  No LGA matched &ldquo;{searchTerm}&rdquo; in {selectedState.name}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}