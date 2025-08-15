import React, { useState, useEffect } from 'react';

function PhysicsSettingsManager({ physicsSettings, onApplyPhysicsSettings }) {
    const [schemeName, setSchemeName] = useState('');
    const [schemes, setSchemes] = useState({});
    const [selectedScheme, setSelectedScheme] = useState('');

    useEffect(() => {
        const storedSchemes = JSON.parse(localStorage.getItem('physicsSchemes')) || {};
        setSchemes(storedSchemes);
    }, []);

    const populateSchemes = (updatedSchemes) => {
        setSchemes(updatedSchemes);
        if (Object.keys(updatedSchemes).length > 0) {
            setSelectedScheme(Object.keys(updatedSchemes)[0]);
        } else {
            setSelectedScheme('');
        }
    };

    const handleSaveScheme = () => {
        if (!schemeName.trim()) {
            alert('Please enter a name for your physics scheme.');
            return;
        }

        const newSchemes = {
            ...schemes,
            [schemeName]: physicsSettings // Save current physics settings
        };
        localStorage.setItem('physicsSchemes', JSON.stringify(newSchemes));
        populateSchemes(newSchemes);
        setSchemeName('');
    };

    const handleLoadScheme = () => {
        if (!selectedScheme) {
            alert('Please select a physics scheme to load.');
            return;
        }
        const scheme = schemes[selectedScheme];
        if (scheme) {
            onApplyPhysicsSettings(scheme);
        }
    };

    const handleDeleteScheme = () => {
        if (!selectedScheme) {
            alert('Please select a physics scheme to delete.');
            return;
        }
        const newSchemes = { ...schemes };
        delete newSchemes[selectedScheme];
        localStorage.setItem('physicsSchemes', JSON.stringify(newSchemes));
        populateSchemes(newSchemes);
    };

    return (
        <div className="control-group">
            <div className="row" style={{ fontWeight: 600, marginBottom: '6px' }}>Physics Settings</div>
            <div className="row">
                <input
                    type="text"
                    placeholder="Physics Scheme Name"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                />
                <button onClick={handleSaveScheme} style={{ marginLeft: '10px' }}>Save</button>
            </div>
            <div className="row">
                <select
                    value={selectedScheme}
                    onChange={(e) => setSelectedScheme(e.target.value)}
                >
                    {Object.keys(schemes).map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <button onClick={handleLoadScheme} style={{ marginLeft: '10px' }}>Load</button>
                <button onClick={handleDeleteScheme} style={{ marginLeft: '10px' }}>Delete</button>
            </div>
        </div>
    );
}

export default PhysicsSettingsManager;