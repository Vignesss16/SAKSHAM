import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#0e1417',
    padding: 40,
    color: '#dde3e7',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '4px solid #00d1ff',
    padding: 40,
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  header: {
    fontSize: 36,
    color: '#dde3e7',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 14,
    color: '#00d1ff',
    marginBottom: 50,
    letterSpacing: 2,
  },
  text: {
    fontSize: 14,
    color: '#bbc9cf',
    marginBottom: 20,
  },
  name: {
    fontSize: 48,
    color: '#ffffff',
    marginVertical: 20,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: '#00d1ff',
    marginVertical: 20,
  },
  description: {
    fontSize: 14,
    color: '#bbc9cf',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: '80%',
    marginHorizontal: 'auto',
  },
  highlight: {
    color: '#44e2cd',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 40,
    borderTop: '1px solid #242424',
  },
  footerCol: {
    flexDirection: 'column',
  },
  footerLabel: {
    fontSize: 10,
    color: '#bbc9cf',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  footerValue: {
    fontSize: 14,
    color: '#dde3e7',
    fontWeight: 'bold',
  },
});

interface CertificatePDFProps {
  name: string;
  role: string;
  score: number;
  date: string;
  certId: string;
}

export const CertificatePDF = ({ name, role, score, date, certId }: CertificatePDFProps) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.border}>
        <Text style={styles.header}>CERTIFICATE</Text>
        <Text style={styles.subheader}>OF PROFESSIONAL ACHIEVEMENT</Text>
        
        <Text style={styles.text}>This is to certify that</Text>
        
        <Text style={styles.name}>{name.toUpperCase()}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.description}>
          Has successfully completed the advanced {role} AI-driven simulation and performance assessment with a proficiency score of {score}/100.
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Date Issued</Text>
            <Text style={styles.footerValue}>{date}</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Certificate ID</Text>
            <Text style={styles.footerValue}>{certId}</Text>
          </View>
          <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.footerValue, { fontStyle: 'italic', color: '#00d1ff' }]}>SAKSHAM.AI Certification</Text>
            <Text style={styles.footerLabel}>Authorized Signature</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);
