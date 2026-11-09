import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV = [
  { label: 'Overview', to: '/admin', icon: <DashboardOutlinedIcon />, match: 'exact' as const },
  { label: 'All Reports', to: '/admin/reports', icon: <ListAltOutlinedIcon />, match: 'prefix' as const },
  { label: 'Map View', to: '/admin/map', icon: <MapOutlinedIcon />, match: 'prefix' as const },
  { label: 'Resolved', to: '/admin/reports?status=resolved', icon: <CheckCircleOutlineIcon />, match: 'prefix' as const },
  { label: 'Rejected', to: '/admin/reports?status=rejected', icon: <CancelOutlinedIcon />, match: 'prefix' as const },
  { label: 'Profile', to: '/admin/profile', icon: <PersonOutlinedIcon />, match: 'prefix' as const },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 76;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const email = user?.email ?? '';

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.match === 'exact') return location.pathname === item.to;
    const base = item.to.split('?')[0];
    return location.pathname === base || location.pathname.startsWith(base + '/');
  };

  const handleSignOut = async () => {
    setAnchorEl(null);
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#FAFAF7' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 2, minHeight: 64 }}>
        <Box sx={{ width: 30, height: 30, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 17, color: 'secondary.main' }} />
        </Box>
        {!collapsed && (
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FAFAF7', lineHeight: 1 }}>
            StreetPulse
            <Typography component="span" sx={{ display: 'block', fontSize: '0.65rem', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Authority
            </Typography>
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => setCollapsed((c) => !c)} sx={{ display: { xs: 'none', md: 'flex' }, color: 'rgba(250,250,247,0.6)' }}>
          <ChevronLeftIcon sx={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5,
                  px: 1.75,
                  py: 1.1,
                  color: active ? '#FAFAF7' : 'rgba(250,250,247,0.7)',
                  bgcolor: active ? 'rgba(255,181,71,0.14)' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  '&:hover': { bgcolor: active ? 'rgba(255,181,71,0.18)' : 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, justifyContent: 'center', color: active ? 'primary.main' : 'rgba(250,250,247,0.6)' }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleSignOut} sx={{ borderRadius: 1.5, px: 1.75, py: 1.1, color: 'rgba(250,250,247,0.6)', '&:hover': { bgcolor: 'rgba(201,67,67,0.12)', color: 'error.light' } }}>
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, justifyContent: 'center' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#F0F3F6', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <Box
        component="nav"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          bgcolor: 'secondary.main',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: { xs: 'none', md: 'block' },
          transition: 'width 0.2s ease',
          zIndex: 1200,
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, bgcolor: 'secondary.main' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#FAFAF7' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {sidebarContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          ml: { md: `${sidebarWidth}px` },
          transition: 'margin-left 0.2s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, color: 'secondary.main' }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', lineHeight: 1.1 }}>
                Authority Dashboard
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Monitor reported streetlight faults and coordinate their resolution.
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' }, mr: 1 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </Typography>
            <Tooltip title={email}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', color: '#FAFAF7', fontSize: '0.85rem', fontWeight: 700 }}>
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { minWidth: 220, mt: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>{displayName}</Typography>
                <Typography variant="caption" color="text.secondary">{email}</Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'primary.dark', fontWeight: 700, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Administrator
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={RouterLink} to="/admin/profile" onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1.25 }}>
                <PersonOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Profile</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', py: 1.25 }}>
                <Typography variant="body2">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
