import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello, User</Text>
        <Text style={styles.dashboardTitle}>Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.statTitle}>Monthly Total</Text>
            <Text style={styles.statValue}>₺0.00</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.statTitle}>Average Receipt</Text>
            <Text style={styles.statValue}>₺0.00</Text>
          </View>
        </View>
        <View style={[styles.statCard, { marginTop: 16 }]}>
          <Text style={styles.statTitle}>Most Visited</Text>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statSubtitle}>0 visits</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Spending</Text>
        <LineChart
          data={{
            labels: ["1", "2", "3", "4", "5", "6"],
            datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
          }}
          width={width - 64} // padding
          height={220}
          yAxisLabel="₺"
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 108, 250, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#4A6CFA" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending by Store</Text>
        <PieChart
          data={[]}
          width={width - 64}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          absolute
          hasLegend={false}
        />
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data found</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={styles.chartTitle}>Recent Receipts</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No receipts added yet</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  helloText: {
    fontSize: 14,
    color: '#888',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  }
});
