import React, {useContext} from 'react'
import Header from '../components/header'
import Sidebar from '../components/sidebar'
import {MyContext} from '../App'

const MainLayout = ({children}) => {
    const {isSidebarOpen} = useContext(MyContext)

    return (
        <section className="main">
            <Header/>
            <div className="contentMain flex" style={{ paddingTop: '100px' }}>
                <div
                    className={`overflow-hidden sidebarWrapper transition-all`}
                    style={{
                        width: isSidebarOpen ? '300px' : '0px',
                        opacity: isSidebarOpen ? 1 : 0
                    }}>
                    <Sidebar/>
                </div>
                <div className={`contentRight py-4 px-5 transition-all`}
                    style={{
                        width: isSidebarOpen ? 'calc(100% - 300px)' : '100%'
                    }}>
                    {children}
                </div>
            </div>
        </section>
    )
}

export default MainLayout
