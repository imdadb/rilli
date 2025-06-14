import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  EventNote as EventIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_school_id: string;
  class_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  marked_by: string;
  marked_at: string;
}

interface Student {
  id: string;
  name: string;
  school_id: string;
  class_id: string;
  class_name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  teacher_name?: string;
  student_count: number;
}

interface AttendanceStats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

function AttendancePage() {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialog states
  const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false);
  const [bulkMarkDialog, setBulkMarkDialog] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { can, currentEmail } = useAuth();
  const canMarkAttendance = can('mark_attendance');
  const canViewAttendance = can('see_attendance');

  // Tab configuration
  const tabs = [
    { label: 'Daily Attendance', value: 'daily' },
    { label: 'Attendance Reports', value: 'reports' },
    { label: 'Class Overview', value: 'overview' },
  ];

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    if (canViewAttendance) {
      fetchData();
    }
  }, [selectedDate, selectedClass, canViewAttendance]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade, teacher_name')
        .eq('status', 'active')
        .order('grade, name');

      if (classesError) throw classesError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          school_id,
          email,
          class_enrollments (
            class_id,
            classes (
              id,
              name
            )
          )
        `)
        .eq('user_type', 'student')
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      // Process students data
      const processedStudents = studentsData?.map((student: any) => ({
        id: student.id,
        name: student.name || 'Unknown',
        school_id: student.school_id || '',
        email: student.email,
        class_id: student.class_enrollments?.[0]?.class_id || '',
        class_name: student.class_enrollments?.[0]?.classes?.name || 'No Class',
      })) || [];

      // Fetch attendance records for selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          date,
          status,
          notes,
          marked_by,
          marked_at,
          users!attendance_student_id_fkey (
            name,
            school_id,
            class_enrollments (
              classes (
                name
              )
            )
          )
        `)
        .eq('date', dateStr)
        .order('marked_at', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Process attendance data
      const processedAttendance = attendanceData?.map((record: any) => ({
        id: record.id,
        student_id: record.student_id,
        student_name: record.users?.name || 'Unknown',
        student_school_id: record.users?.school_id || '',
        class_name: record.users?.class_enrollments?.[0]?.classes?.name || 'No Class',
        date: record.date,
        status: record.status,
        notes: record.notes,
        marked_by: record.marked_by,
        marked_at: record.marked_at,
      })) || [];

      // Calculate stats
      const totalStudents = processedStudents.length;
      const present = processedAttendance.filter(r => r.status === 'present').length;
      const absent = processedAttendance.filter(r => r.status === 'absent').length;
      const late = processedAttendance.filter(r => r.status === 'late').length;
      const excused = processedAttendance.filter(r => r.status === 'excused').length;
      const attendanceRate = totalStudents > 0 ? ((present + late + excused) / totalStudents) * 100 : 0;

      setClasses(classesData || []);
      setStudents(processedStudents);
      setAttendanceRecords(processedAttendance);
      setStats({
        totalStudents,
        present,
        absent,
        late,
        excused,
        attendanceRate,
      });

    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on class and search
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Class filter
      if (selectedClass !== 'all' && student.class_id !== selectedClass) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(searchLower) ||
          student.school_id.toLowerCase().includes(searchLower) ||
          student.class_name.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [students, selectedClass, searchTerm]);

  // Mark attendance for a student
  const markAttendance = async (studentId: string, status: AttendanceStatus, notes?: string) => {
    if (!canMarkAttendance) return;

    try {
      setSaving(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Check if attendance already exists
      const existingRecord = attendanceRecords.find(r => r.student_id === studentId);

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({
            status,
            notes: notes || null,
            marked_by: currentEmail,
            marked_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: dateStr,
            status,
            notes: notes || null,
            marked_by: currentEmail,
            marked_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Refresh data
      await fetchData();

      setSnackbar({
        open: true,
        message: 'Attendance marked successfully!',
        severity: 'success',
      });

    } catch (err) {
      console.error('Error marking attendance:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark attendance. Please try again.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Bulk mark attendance
  const bulkMarkAttendance = async (studentIds: string[], status: AttendanceStatus) => {
    if (!canMarkAttendance) return;

    try {
      setSaving(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      const operations = studentIds.map(async (studentId) => {
        const existingRecord = attendanceRecords.find(r => r.student_id === studentId);

        if (existingRecord) {
          return supabase
            .from('attendance')
            .update({
              status,
              marked_by: currentEmail,
              marked_at: new Date().toISOString(),
            })
            .eq('id', existingRecord.id);
        } else {
          return supabase
            .from('attendance')
            .insert({
              student_id: studentId,
              date: dateStr,
              status,
              marked_by: currentEmail,
              marked_at: new Date().toISOString(),
            });
        }
      });

      const results = await Promise.all(operations);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error(`Failed to mark attendance for ${errors.length} students`);
      }

      // Refresh data
      await fetchData();
      setBulkMarkDialog(false);
      setSelectedStudents([]);

      setSnackbar({
        open: true,
        message: `Attendance marked for ${studentIds.length} students!`,
        severity: 'success',
      });

    } catch (err) {
      console.error('Error bulk marking attendance:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark bulk attendance. Please try again.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get attendance status for a student
  const getStudentAttendanceStatus = (studentId: string): AttendanceStatus | null => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record ? record.status : null;
  };

  // Status chip configuration
  const getStatusChipProps = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return { color: 'success' as const, label: 'Present', icon: <PresentIcon /> };
      case 'absent':
        return { color: 'error' as const, label: 'Absent', icon: <AbsentIcon /> };
      case 'late':
        return { color: 'warning' as const, label: 'Late', icon: <LateIcon /> };
      case 'excused':
        return { color: 'info' as const, label: 'Excused', icon: <EventIcon /> };
      default:
        return { color: 'default' as const, label: 'Unknown', icon: null };
    }
  };

  // DataGrid columns for attendance records
  const attendanceColumns: GridColDef[] = [
    {
      field: 'student_school_id',
      headerName: 'Student ID',
      width: 120,
      sortable: true,
    },
    {
      field: 'student_name',
      headerName: 'Student Name',
      width: 200,
      sortable: true,
    },
    {
      field: 'class_name',
      headerName: 'Class',
      width: 150,
      sortable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const chipProps = getStatusChipProps(params.value);
        return (
          <Chip
            {...chipProps}
            size="small"
            variant="filled"
          />
        );
      },
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 200,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'marked_by',
      headerName: 'Marked By',
      width: 180,
      sortable: true,
    },
    {
      field: 'marked_at',
      headerName: 'Marked At',
      width: 160,
      renderCell: (params) => new Date(params.value).toLocaleTimeString(),
    },
  ];

  if (canMarkAttendance) {
    attendanceColumns.push({
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            // Handle edit attendance
            setMarkAttendanceDialog(true);
          }}
        />,
      ],
    });
  }

  if (!canViewAttendance) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Alert severity="error">
            You don't have permission to view attendance records.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Attendance Management
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Track and manage student attendance across all classes.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.present}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Present
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {stats.absent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Absent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.late}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Late
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.attendanceRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Attendance Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Controls */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newValue) => newValue && setSelectedDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 150 },
                  },
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Class"
                >
                  <MenuItem value="all">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Search Students"
                placeholder="Search by name, ID, or class"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              {canMarkAttendance && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setBulkMarkDialog(true)}
                  disabled={saving}
                >
                  Bulk Mark
                </Button>
              )}
            </Stack>
          </Paper>

          {/* Tabs */}
          <Paper elevation={1} sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
            >
              {tabs.map((tab, index) => (
                <Tab key={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Paper elevation={2} sx={{ height: 600 }}>
              <DataGrid
                rows={attendanceRecords}
                columns={attendanceColumns}
                pagination
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 },
                  },
                }}
                slots={{
                  toolbar: GridToolbar,
                }}
                disableRowSelectionOnClick
              />
            </Paper>
          )}

          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attendance Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed attendance reports and analytics will be available here.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ mt: 2 }}
              >
                Export Report
              </Button>
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Class Overview
              </Typography>
              <Grid container spacing={2}>
                {classes.map((cls) => (
                  <Grid item xs={12} sm={6} md={4} key={cls.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{cls.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Grade: {cls.grade}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Teacher: {cls.teacher_name || 'Not assigned'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Bulk Mark Dialog */}
          <Dialog
            open={bulkMarkDialog}
            onClose={() => setBulkMarkDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Bulk Mark Attendance</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select students and mark their attendance status for {selectedDate.toDateString()}.
              </Typography>
              
              <List>
                {filteredStudents.map((student) => {
                  const currentStatus = getStudentAttendanceStatus(student.id);
                  const isSelected = selectedStudents.includes(student.id);
                  
                  return (
                    <ListItem key={student.id} divider>
                      <ListItemText
                        primary={`${student.name} (${student.school_id})`}
                        secondary={`Class: ${student.class_name}`}
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {currentStatus && (
                            <Chip
                              {...getStatusChipProps(currentStatus)}
                              size="small"
                            />
                          )}
                          <Switch
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudents(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                          />
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBulkMarkDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => bulkMarkAttendance(selectedStudents, 'present')}
                variant="contained"
                color="success"
                disabled={selectedStudents.length === 0 || saving}
              >
                Mark Present
              </Button>
              <Button
                onClick={() => bulkMarkAttendance(selectedStudents, 'absent')}
                variant="contained"
                color="error"
                disabled={selectedStudents.length === 0 || saving}
              >
                Mark Absent
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}

export default AttendancePage;