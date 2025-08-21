import React from 'react';
import { testUsernameGeneration } from '../../utils/usernameGenerator';

const UsernameGeneratorTest = () => {
    const runTest = () => {
        testUsernameGeneration();
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Username Generator Test</h2>
            <button onClick={runTest} style={{ padding: '10px 20px', marginBottom: '20px' }}>
                Run Test
            </button>
            <p>Mở Developer Console để xem kết quả test</p>
        </div>
    );
};

export default UsernameGeneratorTest; 