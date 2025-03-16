import React from "react";
import { Paper } from "@mui/material";

interface Option {
    value: string;
    label: string;
}

interface SelectPaperProps {
    options: Option[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SelectPaper: React.FC<SelectPaperProps> = ({ options, value, onChange }) => {
  return (
    <Paper elevation={3} style={{ padding: "10px", display: "inline-block" }}>
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Paper>
  );
};

export default SelectPaper;
