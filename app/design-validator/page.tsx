"use client";

import { useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  Chip,
  Typography,
  CircularProgress,
  TextField,
  IconButton,
  Paper,
  Stack,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import ErrorIcon from "@mui/icons-material/Error";

type Specification = {
  id: number;
  key: string;
  value: string;
};

type Process = {
  id: number;
  name: string;
  specifications: Specification[];
};

type ValidationRow = {
  id: number;
  process: string;
  specification: string;
  provided: string;
  expected: string;
  status: "PASS" | "WARN" | "FAIL";
  comment: string;
};

type ValidationResult = {
  validation: ValidationRow[];
  overall_status: string;
  reasoning: string;
  suggestion: string;
  confidence: { overall: number };
};

const STANDARDS = [
  "IEC 60502-1",
  "BS 6346",
  "BS 5467",
  "BS 5266-1",
  "IEC 60228",
];

export default function DesignValidatorPage() {
  const [designNumber, setDesignNumber] = useState("D001");
  const [selectedStandard, setSelectedStandard] = useState(STANDARDS[0]);

  const [processes, setProcesses] = useState<Process[]>([
    {
      id: 1,
      name: "Conductor",
      specifications: [
        { id: 101, key: "Material", value: "Copper" },
        { id: 102, key: "Size", value: "16 sqmm" },
        { id: 103, key: "Class", value: "2" },
      ],
    },
    {
      id: 2,
      name: "Insulation",
      specifications: [
        { id: 201, key: "Material", value: "PVC" },
        { id: 202, key: "Thickness", value: "0.8 mm" },
      ],
    },
  ]);

  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- HANDLERS ---

  const handleAddProcess = () => {
    setProcesses([
      ...processes,
      { id: Date.now(), name: "", specifications: [] },
    ]);
  };

  const handleDeleteProcess = (procId: number) => {
    setProcesses(processes.filter((p) => p.id !== procId));
  };

  const handleProcessNameChange = (id: number, newName: string) => {
    setProcesses(processes.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleAddSpec = (procId: number) => {
    setProcesses(processes.map(p => {
      if (p.id === procId) {
        return {
          ...p,
          specifications: [...p.specifications, { id: Date.now(), key: "", value: "" }]
        };
      }
      return p;
    }));
  };

  const handleDeleteSpec = (procId: number, specId: number) => {
    setProcesses(processes.map(p => {
      if (p.id === procId) {
        return {
          ...p,
          specifications: p.specifications.filter(s => s.id !== specId)
        };
      }
      return p;
    }));
  };

  const handleSpecChange = (procId: number, specId: number, field: "key" | "value", val: string) => {
    setProcesses(processes.map(p => {
      if (p.id === procId) {
        return {
          ...p,
          specifications: p.specifications.map(s => s.id === specId ? { ...s, [field]: val } : s)
        };
      }
      return p;
    }));
  };

  const handleValidate = async () => {
    if (!designNumber || processes.length === 0) {
      alert("Please enter Design Number and at least one Process.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Save Design
      setSaving(true);
      const saveRes = await fetch("http://localhost:3000/design/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design_number: designNumber,
          standard: selectedStandard,
          processes: processes.map(p => ({
            name: p.name,
            specifications: p.specifications.map(s => ({ key: s.key, value: s.value }))
          }))
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save design");
      const savedDesign = await saveRes.json();
      setSaving(false);

      // 2. Validate Design
      const validateRes = await fetch(`http://localhost:3000/design/validate/${savedDesign.id}`, {
        method: "POST",
      });

      if (!validateRes.ok) throw new Error("Validation failed");
      const data = await validateRes.json();

      if (data.validation) {
        data.validation = data.validation.map((item: any, index: number) => ({
          ...item,
          id: index,
        }));
      }

      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Operation failed. Check backend.");
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "process", headerName: "Process", flex: 0.8 },
    { field: "specification", headerName: "Specification", flex: 1 },
    { field: "provided", headerName: "Provided", flex: 1 },
    { field: "expected", headerName: "Standard Limit", flex: 1.2 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as "PASS" | "WARN" | "FAIL";
        let color: "success" | "warning" | "error" | "default" = "default";
        if (value === "PASS") color = "success";
        if (value === "WARN") color = "warning";
        if (value === "FAIL") color = "error";
        return <Chip label={value} color={color} size="small" variant="filled" sx={{ fontWeight: "bold" }} />;
      },
    },
    { field: "comment", headerName: "AI Comment", flex: 2 },
  ];

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, background: "#0f172a", color: "white" }}>
      <Box maxWidth="1600px" mx="auto">
        <Typography variant="h4" fontWeight="800" sx={{ mb: 4, background: "linear-gradient(to right, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AI Cable Design Validator (Pro)
        </Typography>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={4} alignItems="flex-start">

          {/* LEFT: INPUT FORM */}
          <Paper sx={{ flex: 1, p: 4, borderRadius: 4, background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(255,255,255,0.1)", minWidth: "400px" }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Design Number"
                  value={designNumber}
                  onChange={(e) => setDesignNumber(e.target.value)}
                  fullWidth
                  sx={{ input: { color: "white" }, label: { color: "rgba(255,255,255,0.7)" }, fieldset: { borderColor: "rgba(255,255,255,0.2)" } }}
                />
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Standard</InputLabel>
                  <Select
                    value={selectedStandard}
                    label="Standard"
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" }, ".MuiSvgIcon-root": { color: "white" } }}
                  >
                    {STANDARDS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Manufacturing Processes</Typography>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddProcess} variant="outlined" size="small">Add Process</Button>
              </Stack>

              {processes.map((proc) => (
                <Accordion key={proc.id} defaultExpanded sx={{ background: "rgba(15, 23, 42, 0.6)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}>
                    <TextField
                      placeholder="Process Name (e.g. Insulation)"
                      value={proc.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleProcessNameChange(proc.id, e.target.value)}
                      variant="standard"
                      sx={{ input: { color: "#38bdf8", fontWeight: "bold", fontSize: "1.1rem" }, width: "80%" }}
                    />
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteProcess(proc.id); }} sx={{ ml: "auto", color: "error.main" }}><DeleteOutlineIcon /></IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {proc.specifications.map((spec) => (
                        <Stack key={spec.id} direction="row" spacing={2}>
                          <TextField placeholder="Spec (e.g. Material)" value={spec.key} onChange={(e) => handleSpecChange(proc.id, spec.id, "key", e.target.value)} size="small" fullWidth sx={{ input: { color: "white" }, fieldset: { borderColor: "rgba(255,255,255,0.1)" } }} />
                          <TextField placeholder="Value (e.g. PVC)" value={spec.value} onChange={(e) => handleSpecChange(proc.id, spec.id, "value", e.target.value)} size="small" fullWidth sx={{ input: { color: "white" }, fieldset: { borderColor: "rgba(255,255,255,0.1)" } }} />
                          <IconButton size="small" onClick={() => handleDeleteSpec(proc.id, spec.id)} sx={{ color: "rgba(255,255,255,0.3)" }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </Stack>
                      ))}
                      <Button startIcon={<AddCircleOutlineIcon />} onClick={() => handleAddSpec(proc.id)} size="small" sx={{ alignSelf: "flex-start", color: "rgba(255,255,255,0.6)" }}>Add Spec</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                sx={{ mt: 4, py: 2, fontSize: "1.1rem", fontWeight: "bold", borderRadius: 3, background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}
              >
                {loading ? (saving ? "Saving to DB..." : "Validating...") : "Save & Validate"}
              </Button>
            </Stack>
          </Paper>

          {/* RIGHT: RESULTS */}
          {result && (
            <Stack spacing={3} flex={1.5} minWidth="500px">
              <Stack direction="row" spacing={2}>
                <Paper sx={{
                  flex: 1,
                  p: 3,
                  borderRadius: 3,
                  background: (() => {
                    const status = result.overall_status.toLowerCase();
                    if (status.includes("fail") || status.includes("non")) return "rgba(239, 68, 68, 0.25)"; // Red
                    if (status.includes("warn") || status.includes("border") || status.includes("review")) return "rgba(245, 158, 11, 0.25)"; // Orange
                    return "rgba(34, 197, 94, 0.25)"; // Green
                  })(),
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">OVERALL STATUS</Typography>
                  <Typography variant="h5" fontWeight="bold" color="white">{result.overall_status}</Typography>
                </Paper>
                <Paper sx={{ flex: 1, p: 3, borderRadius: 3, background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">CONFIDENCE</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#f59e0b">{(result.confidence?.overall * 100).toFixed(0)}%</Typography>
                </Paper>
              </Stack>

              <Paper sx={{ p: 3, borderRadius: 3, background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Typography variant="subtitle2" color="rgba(255,255,255,0.5)" mb={1}>ENGINEERING REASONING</Typography>
                <Typography variant="body1" color="white" mb={2}>{result.reasoning}</Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />
                <Typography variant="subtitle2" color="rgba(255,255,255,0.5)" mb={1}>SUGGESTION</Typography>
                <Typography variant="body1" color="#38bdf8">{result.suggestion}</Typography>
              </Paper>

              <Box sx={{ height: 500, width: "100%", background: "white", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)" }}>
                <DataGrid
                  rows={result.validation}
                  columns={columns}
                  disableRowSelectionOnClick
                  sx={{
                    border: "none",
                    color: "#0f172a", // Dark slate (black-ish)
                    "& .MuiDataGrid-cell": {
                      borderColor: "#e2e8f0",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontWeight: "bold",
                    },
                    "& .MuiDataGrid-row:hover": {
                      background: "#f8fafc",
                    },
                  }}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
