import { useState, useEffect, useMemo, useRef } from "react";


// TODO: depracated
export function useIsInViewport() {
    const [isIntersecting, setIsIntersecting] = useState(true);
    const activeDateElement = useRef<HTMLButtonElement>(null)
    
    const observer = useMemo(
      () =>
        new IntersectionObserver((test) => {
            test.forEach(entry => {
                if (!entry.isIntersecting) {
                    console.log(entry.isIntersecting)
                    setIsIntersecting(entry.isIntersecting)
                }
            })
        },
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [activeDateElement],
    );
  
    useEffect(() => {
        if (!activeDateElement.current) return
        observer.observe(activeDateElement.current);
    
        return () => {
            observer.disconnect();
        };
    }, [activeDateElement, observer]);
  
    return {activeDateElement, isInView: isIntersecting};
  }