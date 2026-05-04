import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#0e1417',
    padding: 0,
    color: '#dde3e7',
  },
  container: {
    margin: 30,
    padding: 40,
    height: '90%',
    backgroundColor: '#121212',
    border: '2px solid #00d1ff',
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  headerIcon: {
    color: '#00d1ff',
    fontSize: 40,
    marginBottom: 10,
  },
  header: {
    fontSize: 32,
    color: '#dde3e7',
    marginBottom: 5,
    fontWeight: 'heavy',
    letterSpacing: 6,
  },
  subheader: {
    fontSize: 10,
    color: '#00d1ff',
    marginBottom: 40,
    letterSpacing: 3,
  },
  certifyText: {
    fontSize: 14,
    color: '#bbc9cf',
    marginBottom: 15,
  },
  name: {
    fontSize: 48,
    color: '#ffffff',
    marginVertical: 15,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: '#00d1ff',
    marginVertical: 15,
  },
  description: {
    fontSize: 13,
    color: '#bbc9cf',
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: '80%',
    marginHorizontal: 'auto',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingTop: 40,
    borderTop: '1px solid #242424',
  },
  footerCol: {
    flex: 1,
    flexDirection: 'column',
  },
  footerLabel: {
    fontSize: 8,
    color: '#bbc9cf',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  footerValue: {
    fontSize: 12,
    color: '#dde3e7',
    fontWeight: 'bold',
  },
  qrSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 70,
    height: 70,
    padding: 5,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 8,
  },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    fontSize: 100,
    color: '#ffffff',
    opacity: 0.03,
    transform: 'rotate(-30deg)',
  }
});

interface CertificatePDFProps {
  name: string;
  role: string;
  score: number;
  date: string;
  certId: string;
}

export const CertificatePDF = ({ name, role, score, date, certId }: CertificatePDFProps) => {
  const verifyUrl = `https://prepwise-ai.vercel.app/verify/${certId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.container}>
          <Text style={styles.watermark}>VERIFIED</Text>
          
          <Text style={styles.header}>CERTIFICATE</Text>
          <Text style={styles.subheader}>OF PROFESSIONAL ACHIEVEMENT</Text>
          
          <Text style={styles.certifyText}>This is to certify that</Text>
          
          <Text style={styles.name}>{name.toUpperCase()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.description}>
            Has successfully completed the advanced {role} AI-driven simulation and performance assessment with a proficiency score of {score}/100.
          </Text>
          
          <View style={styles.footer}>
            <View style={[styles.footerCol, { textAlign: 'left' }]}>
              <Text style={styles.footerLabel}>Date Issued</Text>
              <Text style={styles.footerValue}>{date}</Text>
            </View>
            
            <View style={styles.qrSection}>
              <Image src={qrCodeUrl} style={styles.qrCode} />
              <Text style={[styles.footerLabel, { fontSize: 6 }]}>Verification ID: {certId}</Text>
            </View>

            <View style={[styles.footerCol, { textAlign: 'right' }]}>
              <Text style={[styles.footerValue, { fontStyle: 'italic', color: '#00d1ff', fontSize: 18, marginBottom: 2 }]}>SAKSHAM.AI</Text>
              <Text style={styles.footerLabel}>Authorized Signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
