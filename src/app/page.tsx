import React from 'react'
import './page.module.css'
import Header from '@/components/main/header/header'
import Favorite from '@/components/main/favorite/favorite'
import Recomendation from '@/components/main/recomendations/recomendation'
import Footer from '@/components/footer/footer'
export default function page() {
  return (
      <div>
        <Header/>
        <Favorite/>
        {/* <Recomendation/> */}
        <Footer/>
      </div>
    )
  }


