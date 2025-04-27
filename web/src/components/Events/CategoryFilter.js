import React from 'react';
import { Box, Chip, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { HOBBY_CATEGORIES } from '../../shared/constants/appConstants';

const categories = ['Tümü', ...HOBBY_CATEGORIES];

const getCategoryColor = (category) => {
  if (category === 'Tümü') return '#1976d2';
  
  const colors = {
    'Spor': '#4caf50',
    'Sanat': '#f44336',
    'Müzik': '#9c27b0',
    'Dans': '#ff9800',
    'Yemek': '#795548',
    'Seyahat': '#2196f3',
    'Eğitim': '#607d8b',
    'Teknoloji': '#00bcd4',
    'Doğa': '#8bc34a',
    'Diğer': '#9e9e9e'
  };
  
  return colors[category] || '#9e9e9e';
};

const getCategoryIcon = (category) => {
  switch(category) {
    case 'Tümü':
      return "🔍";
    case 'Spor':
      return "🏀";
    case 'Sanat': 
      return "🎨";
    case 'Müzik':
      return "🎵";
    case 'Dans':
      return "💃";
    case 'Yemek':
      return "🍳";
    case 'Seyahat':
      return "✈️";
    case 'Eğitim':
      return "📚";
    case 'Teknoloji':
      return "💻";
    case 'Doğa':
      return "🌲";
    case 'Diğer':
      return "⭐";
    default:
      return "⭐";
  }
};

const StyledChip = styled(Chip)(({ theme, selected, categorycolor }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected ? `${categorycolor}` : theme.palette.background.paper,
  color: selected ? 'white' : theme.palette.text.primary,
  borderColor: categorycolor,
  borderWidth: selected ? 0 : 1,
  borderStyle: 'solid',
  fontWeight: selected ? 'bold' : 'normal',
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: selected ? categorycolor : `${categorycolor}20`,
  },
  '&:focus': {
    backgroundColor: selected ? categorycolor : `${categorycolor}20`,
  },
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '&': {
    '-ms-overflow-style': 'none',
  }
}));

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <FilterContainer>
      {categories.map((category) => (
        <StyledChip
          key={category}
          label={category}
          clickable
          onClick={() => onSelectCategory(category)}
          selected={selectedCategory === category}
          categorycolor={getCategoryColor(category)}
          avatar={<Avatar>{getCategoryIcon(category)}</Avatar>}
        />
      ))}
    </FilterContainer>
  );
};

export default CategoryFilter; 