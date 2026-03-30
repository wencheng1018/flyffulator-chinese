import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import "./i18n/config.js";
import App from './App.jsx';
import './styles/index.scss';
import flyffulatorLogo from '/logonew.png';
import Annotation from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import LocaleSwitcher from "./i18n/LocaleSwitcher";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, BarElement } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Annotation, ChartDataLabels);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="header" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
      <img src={flyffulatorLogo} className="logo" alt="Flyffulator logo" />
      <h2>飞飞角色装备和加点模拟器</h2>
    </div>
      <App />
    <footer>
      <div className="footer-wrapper">
        <div className="footer-info">
          <p style={{ margin: '5px 0', lineHeight: '1.6' }}>
            源文件仓库地址：<a href="https://github.com/Frostiae/Flyffulator" target="_blank" rel="noopener noreferrer">https://github.com/Frostiae/Flyffulator</a><br />
            本页面由风白映画汉化<br /><br />
            <span style={{ color: '#e6b422' }}>温馨提示：所有数据来源于universe.flyff.com，国服飞飞用户仅参考</span>
          </p>
        </div>
      </div>
    </footer>
  </StrictMode>,
)
