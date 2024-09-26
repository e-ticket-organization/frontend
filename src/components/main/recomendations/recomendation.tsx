'use client'; 

import React, { useCallback } from 'react'
import './recomendation.styles.css'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export default function Recomendation() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000 })])

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    return (
        <section className='recomendation'>
            <h3>Рекомендації</h3>
            <div className='embla'>
                <div className='embla-viewport' ref={emblaRef}>
                    <div className='embla-container'>
                        <div className='embla-slide'>
                            <img className='recomendation-img' src="https://storage.concert.ua/JTR/27/aK/66cdc4cd67ed9/7edd.jpg:31-eventpage-main_banner-desktop2x" alt="Рекомендація 1" />
                        </div>
                        <div className='embla-slide'>
                            <img className='recomendation-img' src="https://storage.concert.ua/JTR/27/aK/66cdc4cd67ed9/7edd.jpg:31-eventpage-main_banner-desktop2x" alt="Рекомендація 2" />
                        </div>
                        <div className='embla-slide'>
                            <img className='recomendation-img' src="https://storage.concert.ua/JTR/27/aK/66cdc4cd67ed9/7edd.jpg:31-eventpage-main_banner-desktop2x" alt="Рекомендація 3" />
                        </div>
                    </div>
                </div>
                <button className="embla-prev" onClick={scrollPrev}>
                    <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                </button>
                <button className="embla-next" onClick={scrollNext}>
                    <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>
                </button>
            </div>
        </section>
    )
}