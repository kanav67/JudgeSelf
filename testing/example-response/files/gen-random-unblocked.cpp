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

    println(t);

    for (int test = 0; test < t; ++test) {
        int n = rnd.next(min_n, max_n);
        int max_possible_m = n * (n - 1) / 2;
        int m = rnd.next(min(min_m, max_possible_m), min(max_m, max_possible_m));
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
        println(status);
        
        int countAi = 0;
        int maxCountAi = 10;
        for (int i = 0; i < q; ++i) {
            if(countAi<maxCountAi){
                countAi++;
                println(1, 1);
                continue;
            }
            int x = rnd.next(1, n);
            int y = rnd.next(1, n);
            println(0, x, y);
        }
    }
}
