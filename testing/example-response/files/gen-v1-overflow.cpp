#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    int t  = opt<int>("t", 1);
    int n  = opt<int>("n", 1000);
    long long min_w   = opt<long long>("min_w", 100'000'000);
    long long max_w   = opt<long long>("max_w", 1000'000'000);
    
    int q = n;
    int m = n-1;
    println(t);

    for (int test = 0; test < t; ++test) {
        println(n, m, q);

        set<pair<int, int>> edgeSet;
        int cnt = 0;
        for (int i = 0; i < m; ++i) {
            edgeSet.insert({cnt + 1, cnt + 2});
            long long w = rnd.next(min_w, max_w);
            println(cnt + 1, cnt + 2, w); //1 index
            cnt++;
        }

        string status(n, '.');
        println(status);
        
        int countAi = 0;
        int maxCountAi = 10;
        for (int i = 0; i < q; ++i) {
            int x = i+1;
            int y = n-i;
            println(0, x, y);
        }
    }
}
