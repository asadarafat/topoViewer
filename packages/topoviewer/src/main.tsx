import { createRoot } from 'react-dom/client';
import { TopoViewerWorkbench } from './components/TopoViewerWorkbench';
import '@xyflow/react/dist/style.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(<TopoViewerWorkbench />);
