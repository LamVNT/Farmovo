import axiosClient from './axiosClient';

const importDetailService = {
    getByStocktakeDate: (date) =>
        axiosClient.get(`/importtransaction/import-details/stocktake`, {
            params: {date}
        }),
};

export default importDetailService; 