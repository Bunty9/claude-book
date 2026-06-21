import { useState, useEffect } from 'react'

/**
 * Returns false during SSR and on the first render, then true after mount.
 * Use this to gate localStorage-derived display values so the server and
 * first client render always agree (avoiding React hydration mismatches).
 *
 * The setState-in-effect here is intentional: we are synchronizing from the
 * browser environment (an external system) to React state.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  return mounted
}
