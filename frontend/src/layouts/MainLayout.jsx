import React, {useContext} from 'react'
import Header from '../components/header'
import Sidebar from '../components/sidebar'
import {MyContext} from '../App'

const MainLayout = ({children}) => {
    const {isSidebarOpen} = useContext(MyContext)

    return (
        <section className="main">
            <Header/>
            <div className="contentMain flex">
                <div
                    className={`overflow-hidden sidebarWrapper ${isSidebarOpen ? 'w-[18%]' : 'w-[0px] opacity-0'} transition-all`}>
                    <Sidebar/>
                </div>
                <div className={`contentRight py-4 px-5 ${isSidebarOpen ? 'w-[82%]' : 'w-[100%]'} transition-all`}>
                    {children}
                </div>
            </div>
        </section>
    )
}

export default MainLayout
