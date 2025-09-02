import { useAuth } from '../contexts/AuthContext'

const PermissionGuard = ({ module, action, children, fallback = null }) => {
  const { hasPermission } = useAuth()
  
  if (!hasPermission(module, action)) {
    return fallback
  }
  
  return children
}

export default PermissionGuard
