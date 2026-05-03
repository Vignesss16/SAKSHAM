import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 400,
    left: 50,
    transform: 'rotate(-45deg)',
    opacity: 0.03,
    zIndex: -1,
  },
  watermarkText: {
    fontSize: 100,
    fontWeight: 'black',
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 15,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerDate: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  headerId: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 4,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 20,
  },
  profileBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  profileTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  profileDesc: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  scoreBox: {
    width: 140,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
  },
  scoreBadge: {
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  metricsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 25,
    marginBottom: 25,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  metricItem: {
    width: '45%',
    marginBottom: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  metricBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    width: '100%',
  },
  metricBarFill: {
    height: 6,
    borderRadius: 3,
  },
  listsSection: {
    flexDirection: 'row',
    gap: 20,
  },
  listCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  listHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  listNumberBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  listNumber: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  listItemDesc: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});

interface PdfReportProps {
  report: any;
  score: number;
  metrics: any[];
  strengths: any[];
  improvements: any[];
}

export const PdfReportTemplate = ({ report, score, metrics, strengths, improvements }: PdfReportProps) => {
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#0ea5e9' : '#f43f5e';
  const scoreLabel = score >= 80 ? 'Exceptional' : score >= 60 ? 'Proficient' : 'Needs Focus';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>PREPAI</Text>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>PrepAI Report</Text>
            <Text style={styles.headerSubtitle}>Candidate Evaluation Summary</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
            <Text style={styles.headerId}>REF ID: {report.id?.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.topSection}>
          <View style={styles.profileBox}>
            <Text style={styles.sectionLabel}>Role Profile</Text>
            <Text style={styles.profileTitle}>{report.title || 'Mock Interview Report'}</Text>
            <Text style={styles.profileDesc}>{report.feedback || "Your report summary appears here."}</Text>
          </View>
          
          <View style={styles.scoreBox}>
            <Text style={styles.sectionLabel}>Overall Score</Text>
            <View style={styles.scoreCircleContainer}>
              <Text style={{ ...styles.scoreText, color: scoreColor }}>{score}</Text>
            </View>
            <View style={{ backgroundColor: scoreColor + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
               <Text style={{ ...styles.scoreBadge, color: scoreColor }}>{scoreLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={{ ...styles.sectionLabel, color: '#000', marginBottom: 15 }}>Performance Breakdown</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((m, idx) => (
              <View key={idx} style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.score}/100</Text>
                </View>
                <View style={styles.metricBarBg}>
                  <View style={{ ...styles.metricBarFill, backgroundColor: scoreColor, width: `${m.score}%` }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.listsSection}>
          <View style={styles.listCol}>
            <Text style={{ ...styles.listHeader, color: '#10b981' }}>Key Strengths</Text>
            {strengths.slice(0, 4).map((s, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={{ ...styles.listNumberBox, backgroundColor: '#10b98120' }}>
                  <Text style={{ ...styles.listNumber, color: '#10b981' }}>{idx + 1}</Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{s.title}</Text>
                  <Text style={styles.listItemDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.listCol}>
            <Text style={{ ...styles.listHeader, color: '#f43f5e' }}>Areas for Growth</Text>
            {improvements.slice(0, 4).map((i, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={{ ...styles.listNumberBox, backgroundColor: '#f43f5e20' }}>
                  <Text style={{ ...styles.listNumber, color: '#f43f5e' }}>{idx + 1}</Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{i.title}</Text>
                  <Text style={styles.listItemDesc}>{i.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by PrepAI Engine</Text>
          <Text style={styles.footerText}>Confidential Assessment</Text>
        </View>

      </Page>
    </Document>
  );
};
