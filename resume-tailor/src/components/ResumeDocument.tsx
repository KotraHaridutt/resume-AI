import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles specifically for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    fontWeight: 'bold',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    width: 15,
    fontSize: 11,
    color: '#333',
  },
  text: {
    fontSize: 11,
    flex: 1,
    lineHeight: 1.5,
    color: '#333',
  },
});

// The component that takes the finalized text and builds the PDF
export const ResumeDocument = ({ bullets }: { bullets: string[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Experience</Text>
      
      {bullets.map((text, i) => (
        <View key={i} style={styles.bulletContainer}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
      
    </Page>
  </Document>
);