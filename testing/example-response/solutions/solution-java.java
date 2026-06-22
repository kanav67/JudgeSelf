import java.util.*;

public class Main {
    static final long INF = (long) 1e18;

    static List<List<Pair>> adj;
    static String status;

    static class Pair {
        int node;
        long weight;

        Pair(int node, long weight) {
            this.node = node;
            this.weight = weight;
        }
    }

    static long[][] allPairsDijkstra(int n, List<List<Pair>> adj, String status) {
        long[][] dist = new long[n][n];
        for (long[] row : dist)
            Arrays.fill(row, INF);

        for (int src = 0; src < n; ++src) {
            if (status.charAt(src) == 'x') continue;

            PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
            dist[src][src] = 0;
            pq.offer(new long[]{0, src});

            while (!pq.isEmpty()) {
                long[] cur = pq.poll();
                long d = cur[0];
                int u = (int) cur[1];

                if (d > dist[src][u]) continue;

                for (Pair val : adj.get(u)) {
                    int v = val.node;
                    long w = val.weight;

                    if (status.charAt(v) == 'x') continue;

                    if (dist[src][v] > dist[src][u] + w) {
                        dist[src][v] = dist[src][u] + w;
                        pq.offer(new long[]{dist[src][v], v});
                    }
                }
            }
        }

        return dist;
    }

    static void solve(Scanner sc) {
        int n = sc.nextInt();
        int m = sc.nextInt();
        int q = sc.nextInt();

        adj = new ArrayList<>();
        for (int i = 0; i < n; i++)
            adj.add(new ArrayList<>());

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt() - 1;
            int v = sc.nextInt() - 1;
            int w = sc.nextInt();
            adj.get(u).add(new Pair(v, w));
            adj.get(v).add(new Pair(u, w));
        }

        status = sc.next();

        long[][] dist = allPairsDijkstra(n, adj, status);

        while (q-- > 0) {
            int type = sc.nextInt();
            if (type == 0) {
                int x = sc.nextInt() - 1;
                int y = sc.nextInt() - 1;
                long ans = dist[x][y];
                System.out.println(ans >= INF ? -1 : ans);
            } else {
                int x = sc.nextInt() - 1;
                char[] statusArr = status.toCharArray();
                statusArr[x] = (statusArr[x] == '.') ? 'x' : '.';
                status = new String(statusArr);
                dist = allPairsDijkstra(n, adj, status);
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int t = sc.nextInt();
        while (t-- > 0) {
            solve(sc);
        }
    }
}
