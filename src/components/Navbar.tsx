import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const BRAND = 'StreetPulse';

function initials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default function Navbar() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? '';
  const email = user?.email ?? '';

  const handleReport = () => { navigate(session ? '/report' : '/signin?redirect=/report'); setMobileOpen(false); };
  const handleSignOut = async () => { setProfileAnchor(null); setMobileOpen(false); await signOut(); navigate('/'); };

  const navLinks = session
    ? [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Reports', to: '/reports' }, { label: 'Help', to: '/#faq' }]
    : [{ label: 'Home', to: '/' }, { label: 'How It Works', to: '/#how-it-works' }, { label: 'Help', to: '/#faq' }];

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'secondary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexGrow: { xs: 1, md: 0 } }}>
            <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#FAFAF7', fontWeight: 700, letterSpacing: '-0.01em' }}>{BRAND}</Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexGrow: 1, ml: 4 }}>
            {navLinks.map((link) => (
              <Button key={link.label} component={RouterLink} to={link.to} sx={{ color: isActive(link.to) ? '#FAFAF7' : 'rgba(250,250,247,0.75)', fontWeight: isActive(link.to) ? 700 : 400, '&:hover': { color: '#FAFAF7', bgcolor: 'rgba(255,255,255,0.06)' } }}>
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Desktop right actions */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
            {session ? (
              <>
                <Button variant="contained" color="primary" startIcon={<ReportProblemOutlinedIcon />} onClick={handleReport}>Report a Fault</Button>
                <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ p: 0.5 }} aria-label="Account menu">
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'secondary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                    {initials(user?.user_metadata?.full_name as string | undefined, email)}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/signin" sx={{ color: 'rgba(250,250,247,0.75)', '&:hover': { color: '#FAFAF7' } }}>Sign In</Button>
                <Button variant="contained" color="primary" startIcon={<ReportProblemOutlinedIcon />} onClick={handleReport}>Report a Fault</Button>
              </>
            )}
          </Box>

          {/* Mobile hamburger */}
          <IconButton edge="end" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, color: '#FAFAF7' }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Desktop profile dropdown */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 220, mt: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>{displayName || email}</Typography>
          {displayName && <Typography variant="caption" color="text.secondary">{email}</Typography>}
        </Box>
        <Divider />
        <MenuItem component={RouterLink} to="/account" onClick={() => setProfileAnchor(null)} sx={{ gap: 1.5, py: 1.25 }}>
          <AccountCircleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="body2">My Account</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', py: 1.25 }}>
          <Typography variant="body2">Sign Out</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 280, bgcolor: 'secondary.main' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#FAFAF7', fontWeight: 700 }}>{BRAND}</Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#FAFAF7' }}><CloseIcon /></IconButton>
        </Box>
        {session && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.9)', fontWeight: 600 }}>{displayName || email}</Typography>
            {displayName && <Typography variant="caption" sx={{ color: 'rgba(250,250,247,0.5)' }}>{email}</Typography>}
          </Box>
        )}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton component={RouterLink} to={link.to} onClick={() => setMobileOpen(false)} sx={{ color: isActive(link.to) ? '#FAFAF7' : 'rgba(250,250,247,0.85)', fontWeight: isActive(link.to) ? 700 : 400, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {session && (
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/account" onClick={() => setMobileOpen(false)} sx={{ color: 'rgba(250,250,247,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemText primary="My Account" />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton onClick={handleReport} sx={{ bgcolor: 'primary.main', color: 'secondary.main', fontWeight: 700, mx: 2, borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' } }}>
              <ReportProblemOutlinedIcon sx={{ mr: 1 }} />
              <ListItemText primary="Report a Fault" />
            </ListItemButton>
          </ListItem>
          {session ? (
            <ListItem disablePadding sx={{ mt: 1 }}>
              <ListItemButton onClick={handleSignOut} sx={{ color: 'rgba(250,250,247,0.6)' }}>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          ) : (
            <ListItem disablePadding sx={{ mt: 1 }}>
              <ListItemButton component={RouterLink} to="/signin" onClick={() => setMobileOpen(false)} sx={{ color: 'rgba(250,250,247,0.6)' }}>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  );
}
