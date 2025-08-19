import { useEffect } from 'react';

export function usePersistentDetails(detailsRefs) {
    useEffect(() => {
        detailsRefs.forEach(ref => {
            const element = ref.current;
            if (element) {
                const id = element.id;
                const savedState = localStorage.getItem(`details:${id}`);
                if (savedState === 'open') {
                    element.open = true;
                } else if (savedState === 'closed') {
                    element.open = false;
                }

                element.addEventListener('toggle', () => {
                    localStorage.setItem(`details:${id}`, element.open ? 'open' : 'closed');
                });
            }
        });
    }, [detailsRefs]);
}
