/**
 * echartsTheme — light/dark theme → echarts theme 对象
 *
 * 颜色方案与 Arco Design 主题保持一致
 */

export const lightTheme = {
  color: ['#165DFF', '#14C9C9', '#F53F3F', '#FF7D00', '#FADC19', '#722ED1', '#3491FA', '#7BE188', '#F5319D', '#D91AD9'],
  backgroundColor: '#ffffff',
  textStyle: { color: '#1D2129' },
  title: { textStyle: { color: '#1D2129' } },
  legend: { textStyle: { color: '#4E5969' } },
};

export const darkTheme = {
  color: ['#3C7EFF', '#1DB8B8', '#F76560', '#FF9A3E', '#FBE13A', '#8B5CF6', '#5B9BFA', '#9AE6A8', '#F95E9D', '#E84AE8'],
  backgroundColor: '#17171A',
  textStyle: { color: '#F2F3F5' },
  title: { textStyle: { color: '#F2F3F5' } },
  legend: { textStyle: { color: '#C9CDD4' } },
};
