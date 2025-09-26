import React from "react";
import TextField from "@mui/material/TextField";

interface SearchProps {
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function Search({ label, onChange }: SearchProps) {
  return (
    <div className="search">
      <TextField
        id="outlined-basic"
        variant="outlined"
        fullWidth
        label={label}
        onChange={onChange}
      />
    </div>
  );
}

export default Search;
