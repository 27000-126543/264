import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SimulationTask, SpectrumData, Report } from '../types';

export const generateSpectrumReport = async (
  task: SimulationTask,
  spectrumData: SpectrumData | undefined,
  sections: string[]
): Promise<string> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yOffset = 20;

  pdf.setFillColor(16, 42, 67);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('分子光谱模拟综合报告', pageWidth / 2, 25, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, 35, { align: 'center' });

  yOffset = 55;

  pdf.setTextColor(16, 42, 67);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('一、分子信息', 20, yOffset);
  yOffset += 8;

  pdf.setDrawColor(108, 92, 231);
  pdf.setLineWidth(0.5);
  pdf.line(20, yOffset, pageWidth - 20, yOffset);
  yOffset += 10;

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const infoItems = [
    { label: '分子名称', value: task.moleculeName },
    { label: '分子式', value: task.formula },
    { label: '任务ID', value: task.id },
    { label: '创建时间', value: new Date(task.createdAt).toLocaleString('zh-CN') },
    { label: '匹配度', value: task.matchScore ? `${task.matchScore}%` : '-' },
  ];

  infoItems.forEach((item) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${item.label}:`, 25, yOffset);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.value, 60, yOffset);
    yOffset += 7;
  });

  yOffset += 10;

  if (yOffset > pageHeight - 40) {
    pdf.addPage();
    yOffset = 20;
  }

  pdf.setTextColor(16, 42, 67);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('二、计算参数', 20, yOffset);
  yOffset += 8;

  pdf.setDrawColor(108, 92, 231);
  pdf.line(20, yOffset, pageWidth - 20, yOffset);
  yOffset += 10;

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  
  const paramItems = [
    { label: '泛函', value: task.parameters.functional },
    { label: '基组', value: task.parameters.basisSet },
    { label: '溶剂模型', value: task.parameters.solventModel || '气相' },
    { label: '光谱类型', value: task.spectrumTypes.join(', ') },
  ];

  paramItems.forEach((item) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${item.label}:`, 25, yOffset);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.value, 60, yOffset);
    yOffset += 7;
  });

  yOffset += 10;

  if (sections.includes('spectrum') && spectrumData) {
    if (yOffset > pageHeight - 60) {
      pdf.addPage();
      yOffset = 20;
    }

    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('三、谱图分析', 20, yOffset);
    yOffset += 8;

    pdf.setDrawColor(108, 92, 231);
    pdf.line(20, yOffset, pageWidth - 20, yOffset);
    yOffset += 10;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.text('下图展示了计算光谱与实验光谱的叠加对比：', 25, yOffset);
    yOffset += 8;

    const chartHeight = 60;
    const chartWidth = pageWidth - 50;
    const chartX = 25;
    const chartY = yOffset;

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    for (let i = 0; i <= 4; i++) {
      const y = chartY + (chartHeight / 4) * i;
      pdf.line(chartX, y, chartX + chartWidth, y);
    }

    pdf.setStrokeColor(108, 92, 231);
    pdf.setLineWidth(0.8);
    const calcPoints = spectrumData.yAxis.slice(0, 50);
    const maxIntensity = Math.max(...calcPoints, 1);
    const stepX = chartWidth / (calcPoints.length - 1);

    for (let i = 0; i < calcPoints.length - 1; i++) {
      const x1 = chartX + i * stepX;
      const y1 = chartY + chartHeight - (calcPoints[i] / maxIntensity) * chartHeight;
      const x2 = chartX + (i + 1) * stepX;
      const y2 = chartY + chartHeight - (calcPoints[i + 1] / maxIntensity) * chartHeight;
      pdf.line(x1, y1, x2, y2);
    }

    if (spectrumData.experimentalData) {
      pdf.setStrokeColor(0, 184, 148);
      const expPoints = spectrumData.experimentalData.yAxis.slice(0, 50);
      const expMax = Math.max(...expPoints, 1);
      for (let i = 0; i < expPoints.length - 1; i++) {
        const x1 = chartX + i * stepX;
        const y1 = chartY + chartHeight - (expPoints[i] / expMax) * chartHeight * 0.9;
        const x2 = chartX + (i + 1) * stepX;
        const y2 = chartY + chartHeight - (expPoints[i + 1] / expMax) * chartHeight * 0.9;
        pdf.line(x1, y1, x2, y2);
      }
    }

    yOffset = chartY + chartHeight + 10;

    pdf.setFontSize(9);
    pdf.setTextColor(108, 92, 231);
    pdf.text('■ 计算光谱', 25, yOffset);
    pdf.setTextColor(0, 184, 148);
    pdf.text('■ 实验光谱', 60, yOffset);
    yOffset += 10;
  }

  if (sections.includes('peaks') && spectrumData) {
    if (yOffset > pageHeight - 60) {
      pdf.addPage();
      yOffset = 20;
    }

    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('四、峰位归属表', 20, yOffset);
    yOffset += 8;

    pdf.setDrawColor(108, 92, 231);
    pdf.line(20, yOffset, pageWidth - 20, yOffset);
    yOffset += 10;

    const peaks = spectrumData.peaks.slice(0, 10);
    
    pdf.setFillColor(108, 92, 231);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(25, yOffset - 5, 30, 8, 'F');
    pdf.rect(55, yOffset - 5, 30, 8, 'F');
    pdf.rect(85, yOffset - 5, pageWidth - 110, 8, 'F');
    pdf.text('位置', 32, yOffset);
    pdf.text('强度', 62, yOffset);
    pdf.text('归属', 92, yOffset);
    yOffset += 10;

    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');

    peaks.forEach((peak, i) => {
      if (i % 2 === 0) {
        pdf.setFillColor(245, 245, 250);
        pdf.rect(25, yOffset - 5, pageWidth - 60, 7, 'F');
      }
      pdf.text(`${peak.position.toFixed(1)} cm⁻¹`, 27, yOffset);
      pdf.text(`${peak.intensity.toFixed(1)}`, 57, yOffset);
      pdf.text(peak.assignment, 87, yOffset);
      yOffset += 7;
    });

    yOffset += 10;
  }

  if (sections.includes('vibration') && spectrumData?.vibrationalModes) {
    if (yOffset > pageHeight - 60) {
      pdf.addPage();
      yOffset = 20;
    }

    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('五、振动模式分析', 20, yOffset);
    yOffset += 8;

    pdf.setDrawColor(108, 92, 231);
    pdf.line(20, yOffset, pageWidth - 20, yOffset);
    yOffset += 10;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('主要振动模式及其对称性质：', 25, yOffset);
    yOffset += 8;

    const modes = spectrumData.vibrationalModes.slice(0, 6);
    modes.forEach((mode, i) => {
      pdf.text(`${i + 1}. 频率: ${mode.frequency.toFixed(1)} cm⁻¹, 对称性: ${mode.symmetry}, 强度: ${mode.intensity.toFixed(1)}`, 30, yOffset);
      yOffset += 6;
    });

    yOffset += 10;
  }

  if (task.adjustmentLogs.length > 0) {
    if (yOffset > pageHeight - 60) {
      pdf.addPage();
      yOffset = 20;
    }

    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('六、参数调整日志', 20, yOffset);
    yOffset += 8;

    pdf.setDrawColor(108, 92, 231);
    pdf.line(20, yOffset, pageWidth - 20, yOffset);
    yOffset += 10;

    task.adjustmentLogs.forEach((log) => {
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`时间: ${new Date(log.timestamp).toLocaleString('zh-CN')}`, 25, yOffset);
      yOffset += 5;
      pdf.text(`调整人: ${log.adjustedBy}`, 30, yOffset);
      yOffset += 5;
      pdf.text(`原参数: ${log.oldParameters.functional} / ${log.oldParameters.basisSet}`, 30, yOffset);
      yOffset += 5;
      pdf.setTextColor(0, 184, 148);
      pdf.text(`新参数: ${log.newParameters.functional} / ${log.newParameters.basisSet}`, 30, yOffset);
      yOffset += 5;
      pdf.setTextColor(60, 60, 60);
      pdf.text(`原因: ${log.reason}`, 30, yOffset);
      yOffset += 10;
    });
  }

  pdf.setFillColor(16, 42, 67);
  pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('高精度分子光谱模拟与智能结构鉴定平台 · 机密文件', pageWidth / 2, pageHeight - 7, { align: 'center' });

  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `光谱报告_${task.moleculeName}_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return pdfUrl;
};

export const exportSpectrumData = (
  spectrumData: SpectrumData,
  format: 'csv' | 'json' = 'csv',
  wavelengthRange?: { min: number; max: number }
): void => {
  let data: string;
  let filename: string;
  let mimeType: string;

  if (format === 'csv') {
    let csvContent = '波长,计算强度,实验强度\n';
    
    spectrumData.xAxis.forEach((x, i) => {
      if (wavelengthRange && (x < wavelengthRange.min || x > wavelengthRange.max)) return;
      const calcY = spectrumData.yAxis[i] || 0;
      const expY = spectrumData.experimentalData?.yAxis[i] || '';
      csvContent += `${x},${calcY},${expY}\n`;
    });
    
    data = csvContent;
    filename = `光谱数据_${spectrumData.type}_${Date.now()}.csv`;
    mimeType = 'text/csv;charset=utf-8;';
  } else {
    const exportData = {
      type: spectrumData.type,
      peaks: spectrumData.peaks,
      xAxis: wavelengthRange 
        ? spectrumData.xAxis.filter(x => x >= wavelengthRange.min && x <= wavelengthRange.max)
        : spectrumData.xAxis,
      yAxis: spectrumData.yAxis,
      matchScore: spectrumData.matchScore,
    };
    data = JSON.stringify(exportData, null, 2);
    filename = `光谱数据_${spectrumData.type}_${Date.now()}.json`;
    mimeType = 'application/json;charset=utf-8;';
  }

  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
