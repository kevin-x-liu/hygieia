import { createContext, useContext } from 'react';

// Context for pantry updates
// This allows components to subscribe to pantry changes
export interface PantryContextType {
  triggerUpdate: () => void;
}

export const PantryContext = createContext<PantryContextType>({
  triggerUpdate: () => {},
});

// Custom hook to use the pantry context
export const usePantryContext = () => useContext(PantryContext);