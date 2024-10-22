import React from 'react';
import "../App.css"

const Dropdown = ({ label, options, selected, onChange }) => {
  return (
    <div className="dropdown">
      <label>{label}</label>
      <select value={selected} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
