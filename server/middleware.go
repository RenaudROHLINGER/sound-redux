package main

import (
	"fmt"
	"net/http"
)

type myHandlerFunc func(http.ResponseWriter, *http.Request) error

func action(f myHandlerFunc) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
	    rw.Header().Set("Access-Control-Allow-Origin", "*")

		if err := f(rw, r); err != nil {
			fmt.Printf("[error] %v\n", err)
			return
		}
	}
}
