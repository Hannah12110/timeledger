
import React from 'react';
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  '投资': 'bg-green-500',
  '维持': 'bg-blue-600',
  '损耗': 'bg-red-500',
};

export const CATEGORY_TEXT_COLORS: Record<Category, string> = {
  '投资': 'text-green-500',
  '维持': 'text-blue-600',
  '损耗': 'text-red-500',
};

export const CATEGORY_BG_LIGHT: Record<Category, string> = {
  '投资': 'bg-green-50',
  '维持': 'bg-blue-50',
  '损耗': 'bg-red-50',
};

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  '投资': <i className="fas fa-chart-line"></i>,
  '维持': <i className="fas fa-tools"></i>,
  '损耗': <i className="fas fa-trash"></i>,
};
