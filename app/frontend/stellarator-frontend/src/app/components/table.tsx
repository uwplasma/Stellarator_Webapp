"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { GridRowId, GridPagination } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

// Type definition for stellarator configuration
interface StellaratorConfig {
  id: number;
  rc1: string | number;
  rc2: string | number;
  zs1: string | number;
  zs2: string | number;
  nfp: number;
  etabar: string | number;
  B2c: string | number;
  iota: string | number;
  beta: string | number;
  r_singularity: string | number;
}

function StellaratorTable() {
  const [configs, setConfigs] = useState<StellaratorConfig[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100  
  });
  
  // State to store the selected rows' IDs
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);

  // Custom filter states
  const [idFilter, setIdFilter] = useState<string>("");

  // Parameter ranges from API (for slider bounds)
  const [paramRanges, setParamRanges] = useState<Record<string, {min: number, max: number}>>({});

  // Range slider values (null means use full range)
  const [iotaRange, setIotaRange] = useState<[number, number] | null>(null);
  const [betaRange, setBetaRange] = useState<[number, number] | null>(null);
  const [rSingularityRange, setRSingularityRange] = useState<[number, number] | null>(null);
  const [etabarRange, setEtabarRange] = useState<[number, number] | null>(null);
  const [B2cRange, setB2cRange] = useState<[number, number] | null>(null);
  const [rc1Range, setRc1Range] = useState<[number, number] | null>(null);
  const [rc2Range, setRc2Range] = useState<[number, number] | null>(null);
  const [zs1Range, setZs1Range] = useState<[number, number] | null>(null);
  const [zs2Range, setZs2Range] = useState<[number, number] | null>(null);

  // Scatter plot data grouped by NFP
  const [scatterData, setScatterData] = useState<Record<number, any[]>>({});
  const [scatterLoading, setScatterLoading] = useState(true);

  // Axis selection for scatter plots (default: iota vs beta)
  const [scatterXAxis, setScatterXAxis] = useState<string>("beta");
  const [scatterYAxis, setScatterYAxis] = useState<string>("iota");

  // Axis scale types for scatter plots (linear or log)
  const [scatterXScale, setScatterXScale] = useState<"linear" | "log">("linear");
  const [scatterYScale, setScatterYScale] = useState<"linear" | "log">("linear");

  // Available parameters for scatter plot axes
  const scatterAxisOptions = [
    { value: "iota", label: "Iota (ι)" },
    { value: "beta", label: "Beta (β)" },
    { value: "r_singularity", label: "r_singularity" },
    { value: "etabar", label: "Etabar" },
    { value: "B2c", label: "B2c" },
    { value: "rc1", label: "rc1" },
    { value: "rc2", label: "rc2" },
    { value: "zs1", label: "zs1" },
    { value: "zs2", label: "zs2" }
  ];

  // Filter scatter data based on range sliders
  const filteredScatterData = useMemo(() => {
    const result: Record<number, any[]> = {};

    for (const nfp of [1, 2, 3, 4, 5]) {
      if (!scatterData[nfp]) {
        result[nfp] = [];
        continue;
      }

      result[nfp] = scatterData[nfp].filter((d: any) => {
        // Apply each range filter if it's set
        if (iotaRange && (d.iota < iotaRange[0] || d.iota > iotaRange[1])) return false;
        if (betaRange && (d.beta < betaRange[0] || d.beta > betaRange[1])) return false;
        if (rSingularityRange && (d.r_singularity < rSingularityRange[0] || d.r_singularity > rSingularityRange[1])) return false;
        if (etabarRange && (d.etabar < etabarRange[0] || d.etabar > etabarRange[1])) return false;
        if (B2cRange && (d.B2c < B2cRange[0] || d.B2c > B2cRange[1])) return false;
        if (rc1Range && (d.rc1 < rc1Range[0] || d.rc1 > rc1Range[1])) return false;
        if (rc2Range && (d.rc2 < rc2Range[0] || d.rc2 > rc2Range[1])) return false;
        if (zs1Range && (d.zs1 < zs1Range[0] || d.zs1 > zs1Range[1])) return false;
        if (zs2Range && (d.zs2 < zs2Range[0] || d.zs2 > zs2Range[1])) return false;
        return true;
      });
    }

    return result;
  }, [scatterData, iotaRange, betaRange, rSingularityRange, etabarRange, B2cRange, rc1Range, rc2Range, zs1Range, zs2Range]);

  // Fetch parameter ranges on mount (for slider bounds)
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/ranges`)
      .then(response => {
        setParamRanges(response.data);
      })
      .catch(error => console.error("Error fetching ranges:", error));
  }, []);

  // Fetch scatter data on mount (for scatter plot grid)
  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scatter`)
      .then(response => {
        setScatterData(response.data);
        setScatterLoading(false);
      })
      .catch(error => {
        console.error("Error fetching scatter data:", error);
        setScatterLoading(false);
      });
  }, []);

  // Fetch configs with filters
  useEffect(() => {
    const { page, pageSize } = paginationModel;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/configs`, {
        params: {
          page: page + 1,
          limit: pageSize,
          search_id: idFilter !== "" ? idFilter : undefined,
          // Range filter params
          iota_min: iotaRange?.[0],
          iota_max: iotaRange?.[1],
          beta_min: betaRange?.[0],
          beta_max: betaRange?.[1],
          r_singularity_min: rSingularityRange?.[0],
          r_singularity_max: rSingularityRange?.[1],
          etabar_min: etabarRange?.[0],
          etabar_max: etabarRange?.[1],
          B2c_min: B2cRange?.[0],
          B2c_max: B2cRange?.[1],
          rc1_min: rc1Range?.[0],
          rc1_max: rc1Range?.[1],
          rc2_min: rc2Range?.[0],
          rc2_max: rc2Range?.[1],
          zs1_min: zs1Range?.[0],
          zs1_max: zs1Range?.[1],
          zs2_min: zs2Range?.[0],
          zs2_max: zs2Range?.[1],
        }
      })
      .then(response => {
        setConfigs(response.data.configs || []);
        setTotalRows(response.data.count || 0);
      })
      .catch(error => console.error(error));
  }, [paginationModel, idFilter, iotaRange, betaRange, rSingularityRange, etabarRange, B2cRange, rc1Range, rc2Range, zs1Range, zs2Range]);

  // Handle scatter plot point click
  const handleScatterClick = (configId: number) => {
    // Open config detail page in new tab
    window.open(`/app/plot/${configId}`, "_blank");

    // Filter table to show this config
    setTimeout(() => {
      setIdFilter(String(configId));
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 100);
  };

  // Attach Plotly event handlers directly (react-plotly.js onHover/onClick don't work reliably)
  const attachPlotlyHandlers = useCallback((_figure: any, graphDiv: any) => {
    if (graphDiv && graphDiv.on) {
      // Remove existing handlers first
      graphDiv.removeAllListeners('plotly_click');

      graphDiv.on('plotly_click', (data: any) => {
        if (data.points && data.points.length > 0) {
          handleScatterClick(data.points[0].customdata);
        }
      });
    }
  }, []);

  // Define the columns for your data, including a new "Open" action column
  const columns = [
    { field: "id", headerName: "ID", width: 70, flex: 0.8 },
    { field: "rc1", headerName: "rc1", width: 130, flex: 1 },
    { field: "rc2", headerName: "rc2", width: 130, flex: 1 },
    // { field: "rc3", headerName: "rc3", width: 130, flex: 1 },
    { field: "zs1", headerName: "zs1", width: 130, flex: 1 },
    { field: "zs2", headerName: "zs2", width: 130, flex: 1 },
    // { field: "zs3", headerName: "zs3", width: 130, flex: 1 },
    { field: "nfp", headerName: "nfp", width: 50, flex: 1 },
    { field: "etabar", headerName: "etabar", width: 130, flex: 1 },
    { field: "B2c", headerName: "B2c", width: 130, flex: 1 },
    // { field: "p2", headerName: "p2", width: 130, flex: 1 },
    { field: "iota", headerName: "iota", width: 130, flex: 1 },
    { field: "beta", headerName: "beta", width: 130, flex: 1 },
    // { field: "DMerc_times_r2", headerName: "DMerc_times_r2", width: 130, flex: 1 },
    // { field: "min_L_grad_B", headerName: "L_grad_B", width: 130, flex: 1 },
    { field: "r_singularity", headerName: "r_singularity", width: 130, flex: 1 },
    // { field: "B20_variation", headerName: "B20_variation", width: 130, flex: 1 },
    {
      field: "open",
      headerName: "Plot",
      width: 100,
      flex: 1,
      renderCell: (params) => (
        <Button 
          variant="contained" 
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row selection when clicking button
            window.open(`/app/plot/${params.row.id}`, "_blank");
          }}
        >
          View
        </Button>
      )
    }
  ];

  // Footer component with "Go to page" input
  function CustomFooter() {
    return (
      <Box sx={{marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <TextField
          label="Go to page"
          type="number"
          size="small"
          sx={{ width: 200, marginBottom: 3 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const page = parseInt((e.target as HTMLInputElement).value) - 1;
              setPaginationModel(prev => ({ ...prev, page }));
            }
          }}
        />
        <GridPagination />
      </Box>
    );
  }

  // Clear all filters
  const handleClearFilters = () => {
    setIdFilter("");
    // Reset all range sliders
    setIotaRange(null);
    setBetaRange(null);
    setRSingularityRange(null);
    setEtabarRange(null);
    setB2cRange(null);
    setRc1Range(null);
    setRc2Range(null);
    setZs1Range(null);
    setZs2Range(null);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // Helper to check if any range filter is active
  const hasActiveRangeFilters = iotaRange !== null || betaRange !== null || rSingularityRange !== null ||
    etabarRange !== null || B2cRange !== null || rc1Range !== null || rc2Range !== null ||
    zs1Range !== null || zs2Range !== null;

  return (
    <Paper sx={{ width: "100%", marginTop: "50px", marginBottom: "10px", padding: 2, paddingRight: 3, overflowX: 'hidden' }}>
      {/* How to Use Section */}
      <Accordion sx={{ marginBottom: 3, backgroundColor: '#f8f9fa' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Useful Information
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Scatter Plots Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Scatter Plot Overview
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>The 5 scatter plots show all configurations grouped by <strong>NFP</strong> (number of field periods).</li>
                  <li>Each point represents a stellarator configuration. Points are colored by <strong>r_singularity</strong> value.</li>
                  <li><strong>Click any point</strong> to open its detail page in a new tab and filter the table to that configuration.</li>
                  <li><strong>Hover</strong> over points to see the configuration ID and parameter values.</li>
                </ul>
              </Typography>
            </Box>

            {/* Axis Selection Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Scatter Plot Axes
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Use the <strong>X-Axis</strong> and <strong>Y-Axis</strong> dropdowns in the sidebar to change which parameters are plotted.</li>
                  <li>Available parameters: Iota (ι), Beta (β), r_singularity, Etabar, B2c, rc1, rc2, zs1, zs2.</li>
                  <li>Use the <strong>Scale</strong> dropdowns to switch between <strong>Linear</strong> and <strong>Log</strong> (logarithmic) axis scales.</li>
                </ul>
              </Typography>
            </Box>

            {/* Search Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Search by ID
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Enter a configuration ID (or partial ID) to filter the table.</li>
                  <li>The search matches any ID containing your input.</li>
                </ul>
              </Typography>
            </Box>

            {/* Range Filters Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Range Filters
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Use the <strong>sliders</strong> to filter configurations by parameter ranges.</li>
                  <li>Drag the slider handles to set minimum and maximum values.</li>
                  <li>Active filters are indicated by <span style={{ color: '#c5050c' }}>(Active)</span> text.</li>
                  <li>Click <strong>Clear All Filters</strong> to reset all filters.</li>
                </ul>
              </Typography>
            </Box>

            {/* Table Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 1 }}>
                Configuration Table
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>The table displays stellarator configurations matching your filters.</li>
                  <li>Click the <strong>View</strong> button to open a configuration&apos;s detail page with 3D visualization.</li>
                  <li>Use <strong>checkboxes</strong> to select multiple configurations, then click <strong>Open All Selected</strong> to view them in new tabs.</li>
                  <li>Navigate pages using the pagination controls or the <strong>Go to page</strong> input.</li>
                </ul>
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Scatter Plot Grid - 5 plots by NFP */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
          Configuration Overview by NFP
        </Typography>

        {scatterLoading ? (
          <Typography>Loading scatter plots...</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(nfp => {
              const xParamLabel = scatterAxisOptions.find(o => o.value === scatterXAxis)?.label || scatterXAxis;
              const yParamLabel = scatterAxisOptions.find(o => o.value === scatterYAxis)?.label || scatterYAxis;
              const xLabel = scatterXScale === "log" ? `Log ${xParamLabel}` : xParamLabel;
              const yLabel = scatterYScale === "log" ? `Log ${yParamLabel}` : yParamLabel;
              return (
                <Box
                  key={nfp}
                  sx={{
                    width: 200,
                    height: 200,
                    cursor: 'pointer'
                  }}
                >
                  <Plot
                    data={[{
                      type: 'scatter',
                      mode: 'markers',
                      x: filteredScatterData[nfp]?.map((d: any) => d[scatterXAxis]) || [],
                      y: filteredScatterData[nfp]?.map((d: any) => d[scatterYAxis]) || [],
                      customdata: filteredScatterData[nfp]?.map((d: any) => d.id) || [],
                      marker: {
                        size: 6,
                        color: filteredScatterData[nfp]?.map((d: any) => d.r_singularity) || [],
                        colorscale: 'Viridis',
                        showscale: false
                      },
                      hovertemplate: `ID: %{customdata}<br>${xLabel}: %{x:.4f}<br>${yLabel}: %{y:.4f}<extra></extra>`
                    }]}
                    layout={{
                      title: { text: `NFP = ${nfp}`, font: { size: 12 } },
                      xaxis: {
                        title: { text: xLabel, font: { size: 10 } },
                        tickfont: { size: 9 },
                        type: scatterXScale
                      },
                      yaxis: {
                        title: { text: yLabel, font: { size: 10 } },
                        tickfont: { size: 9 },
                        type: scatterYScale
                      },
                      margin: { l: 50, r: 10, t: 30, b: 45 },
                      autosize: true,
                      showlegend: false,
                      hovermode: 'closest'
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                    onInitialized={(figure: any, graphDiv: any) => attachPlotlyHandlers(figure, graphDiv)}
                    onUpdate={(figure: any, graphDiv: any) => attachPlotlyHandlers(figure, graphDiv)}
                  />
                </Box>
              );
            })}
            {/* Separate colorbar with label */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 200, ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5, whiteSpace: 'nowrap' }}>
                r_singularity
              </Typography>
              <Box sx={{ width: 70, height: 170, display: 'flex', alignItems: 'center' }}>
                <Plot
                  data={[{
                    type: 'scatter',
                    x: [null],
                    y: [null],
                    mode: 'markers',
                    marker: {
                      color: [0, 1],
                      colorscale: 'Viridis',
                      showscale: true,
                      colorbar: {
                        len: 1,
                        thickness: 15,
                        tickfont: { size: 9 },
                        x: 0.4
                      }
                    },
                    hoverinfo: 'none'
                  }]}
                  layout={{
                    width: 70,
                    height: 170,
                    margin: { l: 0, r: 45, t: 5, b: 5 },
                    xaxis: { visible: false },
                    yaxis: { visible: false },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)'
                  }}
                  config={{ staticPlot: true, displayModeBar: false }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <h2>Select a Stellarator Configuration</h2>

      {/* Main layout: Sidebar + Table */}
      <Box sx={{ display: 'flex', gap: 0, marginTop: 2 }}>

        {/* Left Sidebar - Filters */}
        <Box sx={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          paddingLeft: 2,
          paddingRight: 2,
          maxHeight: 600,
          overflowY: 'auto',
          overflowX: 'hidden',
          // Slim scrollbar styling
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#a1a1a1',
            },
          },
        }}>
          <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 'bold' }}>Filters</Typography>

          {/* Scatter Plot Axes Selection */}
          <Typography variant="subtitle2" sx={{ marginBottom: 1, fontWeight: 'bold', color: '#666' }}>
            Scatter Plot Axes
          </Typography>

          {/* Row 1: X-Axis parameter + X-Axis scale */}
          <Box sx={{ display: 'flex', gap: 1, marginBottom: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>X-Axis</InputLabel>
              <Select
                value={scatterXAxis}
                label="X-Axis"
                onChange={(e) => setScatterXAxis(e.target.value)}
              >
                {scatterAxisOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={scatterXScale}
              exclusive
              onChange={(_, value) => value && setScatterXScale(value)}
              size="small"
            >
              <ToggleButton value="linear" sx={{ px: 1, py: 0.5, fontSize: '0.75rem' }}>Lin</ToggleButton>
              <ToggleButton value="log" sx={{ px: 1, py: 0.5, fontSize: '0.75rem' }}>Log</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Row 2: Y-Axis parameter + Y-Axis scale */}
          <Box sx={{ display: 'flex', gap: 1, marginBottom: 3, alignItems: 'center' }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Y-Axis</InputLabel>
              <Select
                value={scatterYAxis}
                label="Y-Axis"
                onChange={(e) => setScatterYAxis(e.target.value)}
              >
                {scatterAxisOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={scatterYScale}
              exclusive
              onChange={(_, value) => value && setScatterYScale(value)}
              size="small"
            >
              <ToggleButton value="linear" sx={{ px: 1, py: 0.5, fontSize: '0.75rem' }}>Lin</ToggleButton>
              <ToggleButton value="log" sx={{ px: 1, py: 0.5, fontSize: '0.75rem' }}>Log</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Basic Filters */}
          <Box sx={{ marginBottom: 3 }}>
            <TextField
              label="Search by ID"
              size="small"
              fullWidth
              value={idFilter}
              onChange={(e) => {
                setIdFilter(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 }));
              }}
              sx={{ marginBottom: 2 }}
            />

            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={handleClearFilters}
              disabled={idFilter === "" && !hasActiveRangeFilters}
            >
              Clear All Filters
            </Button>
          </Box>

          {/* Range Sliders */}
          <Typography variant="subtitle2" sx={{ marginBottom: 1, fontWeight: 'bold', color: '#666' }}>
            Range Filters {hasActiveRangeFilters && <span style={{ color: '#c5050c' }}>(Active)</span>}
          </Typography>

          {/* Iota slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>Iota: {iotaRange ? `${iotaRange[0].toFixed(3)} - ${iotaRange[1].toFixed(3)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={iotaRange || [paramRanges.iota?.min ?? 0, paramRanges.iota?.max ?? 1]}
              onChange={(_, newValue) => setIotaRange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.iota?.min ?? 0}
              max={paramRanges.iota?.max ?? 1}
              step={0.001}
              disabled={!paramRanges.iota}
            />
          </Box>

          {/* Beta slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>Beta: {betaRange ? `${betaRange[0].toFixed(4)} - ${betaRange[1].toFixed(4)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={betaRange || [paramRanges.beta?.min ?? 0, paramRanges.beta?.max ?? 1]}
              onChange={(_, newValue) => setBetaRange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.beta?.min ?? 0}
              max={paramRanges.beta?.max ?? 1}
              step={0.0001}
              disabled={!paramRanges.beta}
            />
          </Box>

          {/* r_singularity slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>r_singularity: {rSingularityRange ? `${rSingularityRange[0].toFixed(3)} - ${rSingularityRange[1].toFixed(3)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={rSingularityRange || [paramRanges.r_singularity?.min ?? 0, paramRanges.r_singularity?.max ?? 1]}
              onChange={(_, newValue) => setRSingularityRange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.r_singularity?.min ?? 0}
              max={paramRanges.r_singularity?.max ?? 1}
              step={0.001}
              disabled={!paramRanges.r_singularity}
            />
          </Box>

          {/* Etabar slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>Etabar: {etabarRange ? `${etabarRange[0].toFixed(3)} - ${etabarRange[1].toFixed(3)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={etabarRange || [paramRanges.etabar?.min ?? 0, paramRanges.etabar?.max ?? 1]}
              onChange={(_, newValue) => setEtabarRange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.etabar?.min ?? 0}
              max={paramRanges.etabar?.max ?? 1}
              step={0.001}
              disabled={!paramRanges.etabar}
            />
          </Box>

          {/* B2c slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>B2c: {B2cRange ? `${B2cRange[0].toFixed(3)} - ${B2cRange[1].toFixed(3)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={B2cRange || [paramRanges.B2c?.min ?? 0, paramRanges.B2c?.max ?? 1]}
              onChange={(_, newValue) => setB2cRange(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.B2c?.min ?? 0}
              max={paramRanges.B2c?.max ?? 1}
              step={0.001}
              disabled={!paramRanges.B2c}
            />
          </Box>

          {/* rc1 slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>rc1: {rc1Range ? `${rc1Range[0].toFixed(4)} - ${rc1Range[1].toFixed(4)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={rc1Range || [paramRanges.rc1?.min ?? 0, paramRanges.rc1?.max ?? 1]}
              onChange={(_, newValue) => setRc1Range(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.rc1?.min ?? 0}
              max={paramRanges.rc1?.max ?? 1}
              step={0.0001}
              disabled={!paramRanges.rc1}
            />
          </Box>

          {/* rc2 slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>rc2: {rc2Range ? `${rc2Range[0].toFixed(4)} - ${rc2Range[1].toFixed(4)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={rc2Range || [paramRanges.rc2?.min ?? 0, paramRanges.rc2?.max ?? 1]}
              onChange={(_, newValue) => setRc2Range(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.rc2?.min ?? 0}
              max={paramRanges.rc2?.max ?? 1}
              step={0.0001}
              disabled={!paramRanges.rc2}
            />
          </Box>

          {/* zs1 slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>zs1: {zs1Range ? `${zs1Range[0].toFixed(4)} - ${zs1Range[1].toFixed(4)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={zs1Range || [paramRanges.zs1?.min ?? 0, paramRanges.zs1?.max ?? 1]}
              onChange={(_, newValue) => setZs1Range(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.zs1?.min ?? 0}
              max={paramRanges.zs1?.max ?? 1}
              step={0.0001}
              disabled={!paramRanges.zs1}
            />
          </Box>

          {/* zs2 slider */}
          <Box sx={{ marginBottom: 2, px: 1 }}>
            <Typography variant="body2" gutterBottom>zs2: {zs2Range ? `${zs2Range[0].toFixed(4)} - ${zs2Range[1].toFixed(4)}` : 'All'}</Typography>
            <Slider
              size="small"
              value={zs2Range || [paramRanges.zs2?.min ?? 0, paramRanges.zs2?.max ?? 1]}
              onChange={(_, newValue) => setZs2Range(newValue as [number, number])}
              valueLabelDisplay="auto"
              min={paramRanges.zs2?.min ?? 0}
              max={paramRanges.zs2?.max ?? 1}
              step={0.0001}
              disabled={!paramRanges.zs2}
            />
          </Box>
        </Box>

        {/* Right - Table */}
        <Box sx={{ flexGrow: 1, minWidth: 0, paddingLeft: 2, paddingRight: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedRowIds.length > 0) {
                if (selectedRowIds.length > 1) {
                  alert("Please allow popup windows in your browser settings if not all tabs open.");
                }
                const ids = [...selectedRowIds];
                if (ids.length > 0) {
                  window.open(`/app/plot/${ids[0]}`, "_blank");
                  if (ids.length > 1) {
                    setTimeout(() => {
                      for (let i = 1; i < ids.length; i++) {
                        const newWindow = window.open(`/app/plot/${ids[i]}`, "_blank");
                        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                          alert(`Your browser blocked opening ${ids.length - 1} additional tabs. Please check your popup blocker settings.`);
                          break;
                        }
                      }
                    }, 100);
                  }
                }
              }
            }}
            disabled={selectedRowIds.length === 0}
            sx={{ marginBottom: 2 }}
          >
            OPEN ({selectedRowIds.length})
          </Button>

          <DataGrid
            rows={configs}
            columns={columns}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
            pageSizeOptions={[25, 50, 100]}
            rowCount={totalRows}
            checkboxSelection
            disableRowSelectionOnClick
            keepNonExistentRowsSelected
            rowSelectionModel={selectedRowIds}
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRowIds(newSelection as GridRowId[]);
            }}
            sx={{ border: 0, height: 500, minWidth: 800 }}
            slots={{
              footer: CustomFooter
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}

export default StellaratorTable;
