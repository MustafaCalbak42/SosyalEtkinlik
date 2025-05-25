import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Sarsma animasyonunu gerçekleştiren bileşen
 * @param {Object} props - Bileşen özellikleri
 * @param {boolean} props.shake - Animasyonu başlatmak için boolean değer
 * @param {Function} props.onAnimationEnd - Animasyon bittiğinde çalışacak fonksiyon
 * @param {Object} props.style - Stil özellikleri
 * @param {React.ReactNode} props.children - İçerik bileşenleri
 */
const ShakeAnimation = ({ shake, onAnimationEnd, style, children }) => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      // Sarsma animasyonunu başlat
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: 8,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: -8,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true
        })
      ]).start(() => {
        // Animasyon tamamlandığında
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      });
    }
  }, [shake, onAnimationEnd, shakeAnimation]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnimation }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default ShakeAnimation; 