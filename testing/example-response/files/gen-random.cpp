#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    int t      = opt<int>("t", 10);
    int min_n  = opt<int>("min_n", 2);
    int max_n  = opt<int>("max_n", 1000);
    int min_m  = opt<int>("min_m", 1);
    int max_m  = opt<int>("max_m", 1000);
    int min_q  = opt<int>("min_q", 50);
    int max_q  = opt<int>("max_q", 10000);
    long long min_w   = opt<long long>("min_w", 1);
    long long max_w   = opt<long long>("max_w", 1e9);
    
    const long long MAX_TOTAL_NM = 1000000;//1e6
    long long total_nm = 0;

    t = rnd.next(1, t);//randomize testcases
    
    vector<pair<int, int>> test_sizes;
    for (int i = 0; i < t; ++i) {
        int n = rnd.next(min_n, max_n);
        int max_possible_m = min(max_m, n * (n - 1) / 2);
        // if (max_possible_m < min_m) continue;
        int m = rnd.next(min(min_m, max_possible_m), max_possible_m);
        if (total_nm + 1LL * n * m > MAX_TOTAL_NM) break;

        test_sizes.push_back({n, m});
        total_nm += 1LL * n * m;
    }

    println((int)test_sizes.size());

    for (int test = 0; test < (int)test_sizes.size(); ++test) {
        int n = test_sizes[test].first;
        int m = test_sizes[test].second;
        int q = rnd.next(min_q, max_q);

        println(n, m, q);

        set<pair<int, int>> edgeSet;
        for (int i = 0; i < m; ++i) {
            int u, v;
            do {
                u = rnd.next(0, n - 1);
                v = rnd.next(0, n - 1);
            } while (u == v || edgeSet.count({u, v}) || edgeSet.count({v, u}));
            edgeSet.insert({u, v});
            long long w = rnd.next(min_w, max_w);
            println(u + 1, v + 1, w); //1 index
        }

        string status(n, '.');
        for (int i = 0; i < n; ++i)
            status[i] = rnd.next(0, 1) ? '.' : 'x';
        println(status);
        
        int countAi = 0;
        int maxCountAi = 10;
        for (int i = 0; i < q; ++i) {
            int type = rnd.next(0, 1);
            int x = rnd.next(1, n);
            if ((type == 0 && status[x-1] == '.') || (countAi == maxCountAi)) {
                int y = rnd.next(1, n);
                println(0, x, y);
            } else {
                countAi++;
                println(1, x);
            }
        }
    }
}
