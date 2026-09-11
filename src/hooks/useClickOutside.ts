import { useEffect, useRef } from 'react';

/**
 * Hook reutilizável que dispara um callback quando o usuário clica fora
 * do elemento referenciado.
 *
 * @param onClickOutside - Função chamada ao detectar o clique externo
 * @returns ref que deve ser atribuída ao elemento raiz do componente
 */
export function useClickOutside<T extends HTMLElement>(
  onClickOutside: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClickOutside]);

  return ref;
}
