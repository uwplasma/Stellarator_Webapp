import React from "react";
import TextField from "@mui/material/TextField";

function Search({ label, onChange }) {
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