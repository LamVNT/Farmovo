import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import React from "react";

const pieColors = ['#4CAF50', '#FFC107', '#F44336'];

const OrderStatusPieChart = ({data}) => {
    return (
        <div className="bg-white p-5 shadow-md rounded-lg">
            <h3 className="font-semibold mb-2">Order Status</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={pieColors[index % pieColors.length]}/>
                        ))}
                    </Pie>
                    <Tooltip/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default OrderStatusPieChart;
